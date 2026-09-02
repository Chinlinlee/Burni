require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { ObjectId } = require("mongodb");
const {
    TEMPORAL_CATEGORIES,
    classifyTemporalValue,
    loadDefinitions,
    scanTemporalDocument
} = require("@models/FHIR/searchParameter/migration/temporalPreflight");
const {
    DualDatabasePreflightError,
    runDualDatabasePreflight,
    runDualDatabaseWrite
} = require("@models/FHIR/searchParameter/migration/dualDatabaseOperator");
const {
    convertLegacyBsonDate,
    createLegacyBsonDateAmbiguityError,
    detectLegacyBsonDateAmbiguity,
    formatUtcCalendarDate,
    UTC_CALENDAR_DAY_LOSSY_POLICY,
    UTC_ABSOLUTE_TIME_LOSSY_POLICY
} = require("@models/FHIR/searchParameter/migration/temporalConversion");
const { DATE_PRECISION, DATETIME_PRECISION } = require("@models/FHIR/temporal");

/** @type {MongoMemoryServer | null} */
let memoryServer = null;

/** @type {import("mongoose").Connection | null} */
let sourceConnection = null;

/** @type {import("mongoose").Connection | null} */
let targetConnection = null;

async function insertPatient(connection, document) {
    await connection.db.collection("Patient").insertMany([document]);
}

function loadTemporalPreflightWithAmbiguousStub() {
    const conversionPath = require.resolve(
        "@models/FHIR/searchParameter/migration/temporalConversion"
    );
    const preflightPath = require.resolve(
        "@models/FHIR/searchParameter/migration/temporalPreflight"
    );
    delete require.cache[preflightPath];
    delete require.cache[conversionPath];

    const conversionModule = require(conversionPath);
    const originalDetect = conversionModule.detectLegacyBsonDateAmbiguity;
    conversionModule.detectLegacyBsonDateAmbiguity = function ambiguousStub(
        value,
        type,
        path,
        context
    ) {
        if (type === "dateTime" && value instanceof Date && !Number.isNaN(value.getTime())) {
            return {
                ambiguous: true,
                code: "ambiguous-legacy-bson-date",
                reason:
                    "Legacy BSON Date cannot be converted to FHIR date without guessing its calendar date, timezone, or precision",
                temporalType: type,
                resource: context?.resource,
                model: context?.model,
                path,
                value
            };
        }
        return originalDetect(value, type, path, context);
    };

    return require(preflightPath);
}

function reloadDualDatabasePreflightWithAmbiguousStub() {
    const operatorPath = require.resolve(
        "@models/FHIR/searchParameter/migration/dualDatabaseOperator"
    );
    delete require.cache[operatorPath];
    loadTemporalPreflightWithAmbiguousStub();
    return require(operatorPath).runDualDatabasePreflight;
}

describe("dual database BSON date policy", function () {
    before(async function () {
        memoryServer = await MongoMemoryServer.create();
        const baseUri = memoryServer.getUri().replace(/\/?$/, "");
        sourceConnection = mongoose.createConnection(`${baseUri}/source-bson-policy`);
        targetConnection = mongoose.createConnection(`${baseUri}/target-bson-policy`);
        await Promise.all([sourceConnection.asPromise(), targetConnection.asPromise()]);
    });

    after(async function () {
        if (sourceConnection) {
            await sourceConnection.close();
            sourceConnection = null;
        }
        if (targetConnection) {
            await targetConnection.close();
            targetConnection = null;
        }
        if (memoryServer) {
            await memoryServer.stop();
            memoryServer = null;
        }
    });

    beforeEach(async function () {
        await sourceConnection.db.dropDatabase();
        await targetConnection.db.dropDatabase();
    });

    describe("UTC calendar day and absolute time lossy conversion", function () {
        it("uses UTC calendar day for date BSON Dates crossing timezone boundaries", function () {
            const legacyDate = new Date("2020-01-16T02:00:00+05:00");
            const converted = convertLegacyBsonDate(legacyDate, "date", "Patient.birthDate");

            expect(formatUtcCalendarDate(legacyDate)).to.equal("2020-01-15");
            expect(converted).to.deep.equal({
                value: "2020-01-15",
                precision: DATE_PRECISION.DAY,
                normalizedStart: "2020-01-15",
                normalizedEnd: "2020-01-16"
            });
            expect(detectLegacyBsonDateAmbiguity(legacyDate, "date", "Patient.birthDate")).to.include(
                {
                    ambiguous: false,
                    category: "absolute-bson-date",
                    policy: UTC_CALENDAR_DAY_LOSSY_POLICY
                }
            );
        });

        it("converts dateTime and instant BSON Dates with UTC absolute-time lossy policy", function () {
            const dateTimeValue = new Date("2015-02-07T13:28:17.230+02:00");
            const instantValue = new Date("2020-01-15T00:00:00.001Z");

            const dateTimeResult = convertLegacyBsonDate(
                dateTimeValue,
                "dateTime",
                "Observation.effectiveDateTime"
            );
            const instantResult = convertLegacyBsonDate(
                instantValue,
                "instant",
                "Patient.meta.lastUpdated"
            );

            expect(dateTimeResult.value).to.equal("2015-02-07T11:28:17.230Z");
            expect(dateTimeResult.precision).to.equal(DATETIME_PRECISION.FRACTION);
            expect(instantResult.epochSeconds.toString()).to.equal("1579046400.001");
            expect(
                detectLegacyBsonDateAmbiguity(dateTimeValue, "dateTime", "Observation.effectiveDateTime")
            ).to.include({
                ambiguous: false,
                category: "absolute-bson-date",
                policy: UTC_ABSOLUTE_TIME_LOSSY_POLICY
            });
        });
    });

    describe("invalid BSON Date values", function () {
        it("classifies invalid BSON Dates in date fields as invalid temporal values", function () {
            const invalidDate = new Date(Number.NaN);
            const classified = classifyTemporalValue(
                invalidDate,
                "date",
                "Patient",
                "Patient",
                "birthDate"
            );

            expect(classified).to.include({
                category: TEMPORAL_CATEGORIES.INVALID,
                temporalType: "date",
                path: "birthDate",
                reason: "BSON Date contains an invalid time"
            });
        });

        it("classifies invalid BSON Dates in dateTime and instant fields as invalid", function () {
            const invalidDate = new Date(Number.NaN);
            const dateTimeDiagnostic = classifyTemporalValue(
                invalidDate,
                "dateTime",
                "Patient",
                "Patient",
                "deceasedDateTime"
            );
            const instantDiagnostic = classifyTemporalValue(
                invalidDate,
                "instant",
                "Patient",
                "Patient",
                "meta.lastUpdated"
            );

            expect(dateTimeDiagnostic).to.include({
                category: TEMPORAL_CATEGORIES.INVALID,
                temporalType: "dateTime",
                path: "deceasedDateTime"
            });
            expect(instantDiagnostic).to.include({
                category: TEMPORAL_CATEGORIES.INVALID,
                temporalType: "instant",
                path: "meta.lastUpdated"
            });
        });

        it("blocks dual-db write when preflight finds invalid temporal values in source", async function () {
            await insertPatient(sourceConnection, {
                _id: new ObjectId(),
                id: "patient-invalid-write",
                resourceType: "Patient",
                birthDate: "not-a-date"
            });

            const report = await runDualDatabasePreflight({
                sourceConnection,
                catalog: ["Patient"],
                includeHistory: false
            });
            expect(report.valid).to.equal(false);
            expect(report.summary.invalid).to.equal(1);

            try {
                await runDualDatabaseWrite({
                    sourceConnection,
                    targetConnection,
                    catalog: ["Patient"],
                    includeHistory: false,
                    runIdentity: {
                        runId: "bson-policy-invalid-write",
                        sourceDatabaseIdentity: "source-bson-policy",
                        targetDatabaseIdentity: "target-bson-policy"
                    }
                });
                expect.fail("expected preflight failure");
            } catch (error) {
                expect(error).to.be.instanceOf(DualDatabasePreflightError);
                expect(error.report.summary.invalid).to.equal(1);
            }
        });

        it("scans persisted documents for invalid temporal strings through scanTemporalDocument", function () {
            const definitions = loadDefinitions();
            const diagnostics = scanTemporalDocument(
                {
                    resourceType: "Patient",
                    birthDate: "not-a-date",
                    deceasedDateTime: "2020-02-30T12:00:00Z"
                },
                definitions.Patient,
                { resourceType: "Patient", model: "Patient" },
                definitions
            );

            const invalidPaths = diagnostics
                .filter((diagnostic) => diagnostic.category === TEMPORAL_CATEGORIES.INVALID)
                .map((diagnostic) => diagnostic.path);
            expect(invalidPaths).to.include.members(["birthDate", "deceasedDateTime"]);
        });
    });

    describe("unresolved ambiguous BSON date policy", function () {
        it("creates ambiguity errors with unresolved policy metadata", function () {
            const legacyDate = new Date("2020-01-15T12:00:00.000Z");
            const error = createLegacyBsonDateAmbiguityError(legacyDate, "Patient.birthDate", {
                resource: "Patient",
                model: "Patient"
            });

            expect(error.category).to.equal("ambiguous-bson-date");
            expect(error.temporalType).to.equal("date");
            expect(error.message).to.match(/cannot be converted to FHIR date without guessing/);
            expect(error.path).to.equal("Patient.birthDate");
        });

        it("classifies ambiguous dateTime BSON Dates as unresolved during preflight scan", function () {
            const preflightModule = loadTemporalPreflightWithAmbiguousStub();
            const legacyDate = new Date("2020-01-15T12:00:00.000Z");
            const classified = preflightModule.classifyTemporalValue(
                legacyDate,
                "dateTime",
                "Patient",
                "Patient",
                "deceasedDateTime"
            );

            expect(classified).to.include({
                category: TEMPORAL_CATEGORIES.AMBIGUOUS_BSON_DATE,
                code: "ambiguous-legacy-bson-date",
                temporalType: "dateTime",
                path: "deceasedDateTime"
            });
        });

        it("marks dual-db preflight invalid when unresolved ambiguous BSON dates are present", async function () {
            const legacyDate = new Date("2020-01-15T12:00:00.000Z");
            await insertPatient(sourceConnection, {
                _id: new ObjectId(),
                id: "patient-ambiguous",
                resourceType: "Patient",
                deceasedDateTime: legacyDate
            });

            loadTemporalPreflightWithAmbiguousStub();
            const runPreflight = reloadDualDatabasePreflightWithAmbiguousStub();
            const report = await runPreflight({
                sourceConnection,
                catalog: ["Patient"],
                includeHistory: false
            });

            expect(report.valid).to.equal(false);
            expect(report.summary.unresolvedAmbiguousBsonDates).to.equal(1);
            expect(report.summary.lossyBsonDates).to.equal(0);
            expect(
                report.diagnostics.find((diagnostic) => diagnostic.path === "deceasedDateTime")
            ).to.include({
                category: TEMPORAL_CATEGORIES.AMBIGUOUS_BSON_DATE,
                temporalType: "dateTime"
            });
        });
    });
});
