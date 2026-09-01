require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const { compileDefinition } = require("@models/FHIR/searchParameter/compiler/compiler");
const { executeSearchQueryPlan } = require("@models/FHIR/searchParameter/executor/mongoExecutor");
const {
    buildProjectedFilter
} = require("@models/FHIR/searchParameter/executor/searchTypeProjection");
const {
    buildPeriodTemporalFilter
} = require("@models/FHIR/searchParameter/executor/temporalQueryFilter");
const { parseTemporalQueryValue } = require("@models/FHIR/searchParameter/executor/temporalQueryParser");
const {
    DATE_PRECISION,
    DATETIME_PRECISION,
    normalizeDate,
    normalizeDateTime,
    normalizeInstant
} = require("@models/FHIR/temporal");
const { createFakeRequest, createFakeResponse } = require("../../support/fake-http");
const {
    startFhirCrudTestContext,
    stopFhirCrudTestContext
} = require("../../support/fhir/crud-test-context");
const { ensureResourceModel } = require("../../support/fhir/fhir-service");

const COMPARATORS = ["eq", "ne", "lt", "gt", "ge", "le", "sa", "eb", "ap"];

const BIRTH_DATE = "1995";
const PERIOD_START = "2015-02";
const BIRTH_DATE_EXT_URL = "http://example.org/birthDate-source";
const LAST_UPDATED_EXT_URL = "http://example.org/lastUpdated-source";
const PERIOD_START_EXT_URL = "http://example.org/period-start-source";

const INSTANT_SCALAR_PATTERN =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

function decimal128(value) {
    return mongoose.Types.Decimal128.fromString(String(value));
}

function buildTemporalPlan(path, datatype, arrayPaths = [], searchType = "date") {
    return {
        estimatedCost: 1,
        searchType,
        code: path,
        extractionPaths: [
            {
                path,
                datatype,
                ...(arrayPaths.length > 0 ? { arrayPaths } : {})
            }
        ],
        comparators: COMPARATORS
    };
}

function buildPeriodFilter(searchType, value, comparator) {
    const temporal = parseTemporalQueryValue(
        comparator ? `${comparator}${value}` : value,
        searchType
    );
    return buildProjectedFilter(
        searchType,
        temporal.value,
        "effectivePeriod",
        "Period",
        undefined,
        temporal.comparator,
        undefined,
        undefined,
        temporal
    );
}

function expectMissingBoundary(filter, index, field, objectField, operator, value) {
    const boundary = filter.$and[index];
    expect(boundary).to.have.property("$or").with.lengthOf(2);
    expect(boundary.$or[0][field][operator]).to.be.instanceOf(mongoose.Types.Decimal128);
    expect(boundary.$or[0][field][operator].toString()).to.equal(value);
    expect(boundary.$or[1]).to.deep.equal({
        [objectField]: { $exists: false }
    });
}

async function seedCollection(collectionName, documents) {
    const collection = mongoose.connection.collection(collectionName);
    await collection.drop().catch(() => undefined);
    await collection.insertMany(documents);
}

async function queryRoles(collectionName, filter) {
    const documents = await mongoose.connection.collection(collectionName).find(filter).toArray();
    return documents.map((document) => document.role).sort();
}

function dateTime(start, end = Number(start) + 1) {
    return {
        value: "2020-01-01T00:00:00Z",
        precision: "second",
        normalizedStart: decimal128(start),
        normalizedEnd: decimal128(end)
    };
}

function period(start, end) {
    return {
        start: dateTime(start),
        ...(end === undefined ? {} : { end: dateTime(end) })
    };
}

/**
 * @returns {object}
 */
function primitiveExtensionPatientBody() {
    return {
        resourceType: "Patient",
        gender: "male",
        birthDate: BIRTH_DATE,
        _birthDate: {
            extension: [{ url: BIRTH_DATE_EXT_URL, valueString: "chart" }]
        },
        meta: {
            _lastUpdated: {
                extension: [{ url: LAST_UPDATED_EXT_URL, valueString: "system" }]
            }
        },
        contact: [
            {
                period: {
                    start: PERIOD_START,
                    _start: {
                        extension: [{ url: PERIOD_START_EXT_URL, valueString: "estimated" }]
                    }
                }
            }
        ]
    };
}

/**
 * @param {object} body
 */
function createPatientViaCreateService(body) {
    ensureResourceModel("Patient");
    const { CreateService } = require("@root/api/FHIRApiService/services/create.service");
    const req = createFakeRequest({ body, originalUrl: "/Patient" });
    const res = createFakeResponse();
    return new CreateService(req, res, "Patient").create();
}

/**
 * @param {string} id
 */
function readPatientViaReadService(id) {
    ensureResourceModel("Patient");
    const { ReadService } = require("@root/api/FHIRApiService/services/read.service");
    const req = createFakeRequest({
        params: { id },
        originalUrl: `/Patient/${id}`
    });
    const res = createFakeResponse();
    const service = new ReadService(req, res, "Patient");
    return {
        res,
        read: () => service.read()
    };
}

/**
 * @param {unknown} value
 * @param {string} label
 */
function expectUntouchedElementMetadata(value, label) {
    expect(value, label).to.be.an("object");
    expect(value, `${label} must not be unwrapped as a temporal scalar`).to.not.be.a("string");
    expect(value).to.have.property("extension").that.is.an("array").that.is.not.empty;
    expect(value).to.not.have.property("precision");
    expect(value).to.not.have.property("normalizedStart");
    expect(value).to.not.have.property("normalizedEnd");
    expect(value).to.not.have.property("epochSeconds");
    expect(value).to.not.have.property("fractionDigits");
}

/**
 * @param {object} resource
 */
function expectPublicTemporalScalars(resource) {
    expect(resource.birthDate).to.equal(BIRTH_DATE);
    expect(resource.birthDate).to.be.a("string");
    expect(resource).to.not.have.nested.property("birthDate.precision");
    expect(resource.contact[0].period.start).to.equal(PERIOD_START);
    expect(resource.contact[0].period.start).to.be.a("string");
    expect(resource.contact[0].period).to.not.have.nested.property("start.precision");
    expect(resource.meta.lastUpdated).to.be.a("string");
    expect(resource.meta.lastUpdated).to.match(INSTANT_SCALAR_PATTERN);
    expect(resource.meta).to.not.have.nested.property("lastUpdated.precision");
    expect(resource.meta).to.not.have.nested.property("lastUpdated.epochSeconds");
}

describe("Temporal projection acceptance", function () {
    before(async function () {
        this.timeout(120000);
        await startFhirCrudTestContext();
    });

    after(async function () {
        await stopFhirCrudTestContext();
        await mongoose.disconnect();
    });

    describe("Period interval semantics", function () {
        it("projects complete and open-ended Period filters with missing endpoint branches", function () {
            const complete = buildPeriodFilter("date", "2015");
            expect(complete).to.have.property("$and").with.lengthOf(3);
            expectMissingBoundary(
                complete,
                0,
                "effectivePeriod.start.normalizedStart",
                "effectivePeriod.start",
                "$lte",
                "1420070400"
            );
            expectMissingBoundary(
                complete,
                1,
                "effectivePeriod.end.normalizedEnd",
                "effectivePeriod.end",
                "$gte",
                "1451606400"
            );

            const openEnded = buildPeriodFilter("dateTime", "2015-02-07T13:28:17+02:00");
            expectMissingBoundary(
                openEnded,
                0,
                "effectivePeriod.start.normalizedStart",
                "effectivePeriod.start",
                "$lte",
                "1423308497"
            );
            expectMissingBoundary(
                openEnded,
                1,
                "effectivePeriod.end.normalizedEnd",
                "effectivePeriod.end",
                "$gte",
                "1423308498"
            );
        });

        it("matches closed, open-start, and open-end Period hit-sets", async function () {
            const plan = buildTemporalPlan("effectivePeriod", "Period", [], "date");
            const filter = executeSearchQueryPlan(plan, "2020-02-01", "effective");
            const collectionName = "temporal_acceptance_period_hitset";
            await seedCollection(collectionName, [
                {
                    role: "closed",
                    effectivePeriod: period("1577836800", "1583020800")
                },
                {
                    role: "open-end",
                    effectivePeriod: period("1577836800")
                },
                {
                    role: "open-start",
                    effectivePeriod: { end: dateTime("1590969600", "1590969601") }
                },
                {
                    role: "before",
                    effectivePeriod: period("1590969600", "1593552000")
                },
                {
                    role: "after",
                    effectivePeriod: period("1546300800", "1548979200")
                }
            ]);

            expect(await queryRoles(collectionName, filter)).to.deep.equal([
                "closed",
                "open-end",
                "open-start"
            ]);
        });

        it("uses strict half-open intersection for approximate Period searches", function () {
            const temporal = parseTemporalQueryValue("ap2015", "date");
            const filter = buildPeriodTemporalFilter("effectivePeriod", temporal, "ap");

            expect(filter).to.have.property("$and").with.lengthOf(3);
            expectMissingBoundary(
                filter,
                0,
                "effectivePeriod.start.normalizedStart",
                "effectivePeriod.start",
                "$lt",
                "1454760000"
            );
            expectMissingBoundary(
                filter,
                1,
                "effectivePeriod.end.normalizedEnd",
                "effectivePeriod.end",
                "$gt",
                "1416916800"
            );
        });
    });

    describe("Temporal array element correlation", function () {
        it("wraps scalar temporal arrays in one elemMatch with Decimal128 boundaries", function () {
            const plan = buildTemporalPlan("events", "dateTime", ["events"], "dateTime");
            const filter = executeSearchQueryPlan(plan, "2020-01-01T00:00:00Z", "events");
            const elementFilter = filter.events.$elemMatch;

            expect(filter).to.have.nested.property("events.$elemMatch");
            expect(elementFilter).to.have.property("normalizedStart");
            expect(elementFilter).to.have.property("normalizedEnd");
            expect(elementFilter.normalizedStart.$gte).to.be.instanceOf(mongoose.Types.Decimal128);
            expect(elementFilter.normalizedEnd.$lte).to.be.instanceOf(mongoose.Types.Decimal128);
            expect(filter.events.normalizedStart).to.equal(undefined);
        });

        it("does not combine separate scalar temporal elements in hit-set", async function () {
            const plan = buildTemporalPlan("events", "dateTime", ["events"], "dateTime");
            const filter = executeSearchQueryPlan(plan, "2020-01-01T00:00:00Z", "events");
            const collectionName = "temporal_acceptance_array_scalar";
            await seedCollection(collectionName, [
                {
                    role: "cross-element",
                    events: [
                        {
                            normalizedStart: decimal128("1577836800"),
                            normalizedEnd: decimal128("1577836810")
                        },
                        {
                            normalizedStart: decimal128("1577836790"),
                            normalizedEnd: decimal128("1577836801")
                        }
                    ]
                },
                {
                    role: "same-element",
                    events: [
                        {
                            normalizedStart: decimal128("1577836800"),
                            normalizedEnd: decimal128("1577836801")
                        }
                    ]
                }
            ]);

            expect(await queryRoles(collectionName, filter)).to.deep.equal(["same-element"]);
        });

        it("correlates Period start and end within one array element", async function () {
            const plan = buildTemporalPlan("periods", "Period", ["periods"], "dateTime");
            const filter = executeSearchQueryPlan(plan, "2020-01-01T00:00:00Z", "periods");
            const collectionName = "temporal_acceptance_array_period";
            await seedCollection(collectionName, [
                {
                    role: "cross-element",
                    periods: [
                        {
                            start: { normalizedStart: decimal128("1577836790") },
                            end: { normalizedEnd: decimal128("1577836800") }
                        },
                        {
                            start: { normalizedStart: decimal128("1577836801") },
                            end: { normalizedEnd: decimal128("1577836810") }
                        }
                    ]
                },
                {
                    role: "same-element",
                    periods: [
                        {
                            start: { normalizedStart: decimal128("1577836790") },
                            end: { normalizedEnd: decimal128("1577836810") }
                        }
                    ]
                }
            ]);

            expect(await queryRoles(collectionName, filter)).to.deep.equal(["same-element"]);
        });
    });

    describe("Choice path branches", function () {
        it("matches effectiveDate and effectiveDateTime branches independently", async function () {
            const plan = buildTemporalPlan("effectiveDate", "date", [], "date");
            plan.extractionPaths = [
                { path: "effectiveDate", datatype: "date" },
                { path: "effectiveDateTime", datatype: "dateTime" }
            ];
            const dateFilter = executeSearchQueryPlan(plan, "2020-06", "effective");
            const dateTimeFilter = executeSearchQueryPlan(plan, "2020-01-01", "effective");
            const collectionName = "temporal_acceptance_choice";
            await seedCollection(collectionName, [
                {
                    role: "date-branch",
                    effectiveDate: normalizeDate("2020-06-15")
                },
                {
                    role: "date-time-branch",
                    effectiveDateTime: normalizeDateTime("2020-01-01T00:00:00Z")
                },
                {
                    role: "raw-date-time",
                    effectiveDateTime: { value: "2020-01-01T00:00:00Z" }
                },
                { role: "absent" }
            ]);

            expect(await queryRoles(collectionName, dateFilter)).to.deep.equal(["date-branch"]);
            expect(await queryRoles(collectionName, dateTimeFilter)).to.deep.equal([
                "date-time-branch"
            ]);
        });

        it("keeps Observation.effective choice branches equivalent in find and aggregate", async function () {
            const definition = {
                resource: {
                    resourceType: "SearchParameter",
                    url: "http://example.org/SearchParameter/observation-effective",
                    version: "4.0.1",
                    status: "active",
                    code: "observation-effective",
                    base: ["Observation"],
                    type: "date",
                    expression: "Observation.effective"
                },
                canonicalKey: "http://example.org/SearchParameter/observation-effective::4.0.1",
                lookupKeys: ["Observation::observation-effective"]
            };
            const plan = compileDefinition(definition).lookupPlans[
                "Observation::observation-effective"
            ].plan;
            const filter = executeSearchQueryPlan(plan, "2020-01-01", "date");
            const collectionName = "temporal_acceptance_choice_execution";
            await seedCollection(collectionName, [
                { role: "dateTime", effectiveDateTime: dateTime("1577836800") },
                {
                    role: "period",
                    effectivePeriod: period("1577836790", "1577923210")
                },
                { role: "instant", effectiveInstant: { epochSeconds: decimal128("1577836800") } },
                {
                    role: "raw",
                    effectiveDateTime: { value: "2020-01-01T00:00:00Z" }
                }
            ]);

            const findMatches = await mongoose.connection
                .collection(collectionName)
                .find(filter)
                .toArray();
            const aggregateMatches = await mongoose.connection
                .collection(collectionName)
                .aggregate([{ $match: filter }])
                .toArray();

            expect(findMatches.map((entry) => entry.role).sort()).to.deep.equal(
                aggregateMatches.map((entry) => entry.role).sort()
            );
            expect(findMatches.map((entry) => entry.role).sort()).to.deep.equal([
                "dateTime",
                "instant",
                "period"
            ]);
        });
    });

    describe(":missing canonical completeness", function () {
        function missingPlan(extractionPaths) {
            return {
                estimatedCost: 1,
                searchType: "date",
                code: "temporal",
                extractionPaths,
                comparators: []
            };
        }

        it("treats only complete canonical temporal objects as present", async function () {
            const plan = missingPlan([{ path: "effectiveDateTime", datatype: "dateTime" }]);
            const complete = normalizeDateTime("2020-01-01T00:00:00Z");
            const collectionName = "temporal_acceptance_missing_scalar";
            await seedCollection(collectionName, [
                { role: "complete", effectiveDateTime: complete },
                { role: "partial", effectiveDateTime: { value: complete.value } },
                { role: "legacy", effectiveDateTime: complete.value },
                { role: "absent" }
            ]);

            const presentFilter = executeSearchQueryPlan(plan, "false", "effective:missing");
            const missingFilter = executeSearchQueryPlan(plan, "true", "effective:missing");

            expect(await queryRoles(collectionName, presentFilter)).to.deep.equal(["complete"]);
            expect(await queryRoles(collectionName, missingFilter)).to.deep.equal([
                "absent",
                "legacy",
                "partial"
            ]);
        });

        it("requires one complete branch for choice missing searches", async function () {
            const plan = missingPlan([
                { path: "effectiveDateTime", datatype: "dateTime" },
                { path: "effectiveInstant", datatype: "instant" }
            ]);
            const collectionName = "temporal_acceptance_missing_choice";
            await seedCollection(collectionName, [
                { role: "dateTime", effectiveDateTime: dateTime("1577836800") },
                {
                    role: "instant",
                    effectiveInstant: normalizeInstant("2020-01-01T00:00:00Z")
                },
                { role: "incomplete", effectiveDateTime: { value: "2020-01-01T00:00:00Z" } },
                { role: "missing" }
            ]);

            const missingFilter = executeSearchQueryPlan(plan, "true", "effective:missing");
            const presentFilter = executeSearchQueryPlan(plan, "false", "effective:missing");

            expect(await queryRoles(collectionName, missingFilter)).to.deep.equal([
                "incomplete",
                "missing"
            ]);
            expect(await queryRoles(collectionName, presentFilter)).to.deep.equal([
                "dateTime",
                "instant"
            ]);
        });

        it("treats Period endpoints as searchable open or closed canonical bounds for :missing", async function () {
            const plan = missingPlan([{ path: "period", datatype: "Period" }]);
            const start = normalizeDateTime("2020-01-01T00:00:00Z");
            const end = normalizeDateTime("2020-02-01T00:00:00Z");
            const collectionName = "temporal_acceptance_missing_period";
            await seedCollection(collectionName, [
                { role: "closed", period: { start, end } },
                { role: "open-end", period: { start } },
                { role: "open-start", period: { end } },
                { role: "empty-period", period: {} },
                { role: "partial-start", period: { start: { value: start.value } } },
                { role: "raw-start", period: { start: start.value } }
            ]);

            const presentFilter = executeSearchQueryPlan(plan, "false", "period:missing");
            const missingFilter = executeSearchQueryPlan(plan, "true", "period:missing");

            expect(await queryRoles(collectionName, presentFilter)).to.deep.equal([
                "closed",
                "open-end",
                "open-start"
            ]);
            expect(await queryRoles(collectionName, missingFilter)).to.deep.equal([
                "empty-period",
                "partial-start",
                "raw-start"
            ]);
        });
    });

    describe("History snapshot temporal search", function () {
        it("matches canonical birthDate in history snapshots and ignores legacy strings", async function () {
            const plan = buildTemporalPlan("birthDate", "date", [], "date");
            const filter = executeSearchQueryPlan(plan, "2020-01-01", "birthdate");
            const collectionName = "Patient_history_temporal_acceptance";
            await seedCollection(collectionName, [
                {
                    role: "history-hit",
                    meta: { versionId: "1" },
                    birthDate: normalizeDate("2020-01-01")
                },
                {
                    role: "history-raw",
                    meta: { versionId: "2" },
                    birthDate: "2020-01-01"
                },
                {
                    role: "history-partial",
                    meta: { versionId: "3" },
                    birthDate: { value: "2020-01-01" }
                }
            ]);

            expect(await queryRoles(collectionName, filter)).to.deep.equal(["history-hit"]);
        });
    });

    describe("Contained resource temporal extraction", function () {
        it("searches canonical effectiveDateTime inside contained resources", async function () {
            const plan = buildTemporalPlan(
                "contained.effectiveDateTime",
                "dateTime",
                ["contained"],
                "date"
            );
            const filter = executeSearchQueryPlan(plan, "2020-01-01", "contained-date");
            const collectionName = "temporal_acceptance_contained";
            await seedCollection(collectionName, [
                {
                    role: "contained-hit",
                    contained: [
                        {
                            resourceType: "Observation",
                            effectiveDateTime: dateTime("1577836800")
                        }
                    ]
                },
                {
                    role: "contained-raw",
                    contained: [
                        {
                            resourceType: "Observation",
                            effectiveDateTime: { value: "2020-01-01T00:00:00Z" }
                        }
                    ]
                },
                {
                    role: "contained-absent",
                    contained: [{ resourceType: "Observation" }]
                }
            ]);

            expect(await queryRoles(collectionName, filter)).to.deep.equal(["contained-hit"]);
            expect(filter.contained.$elemMatch).to.have.property(
                "effectiveDateTime.normalizedStart"
            );
            expect(filter.contained.$elemMatch).to.have.property(
                "effectiveDateTime.normalizedEnd"
            );
        });
    });

    describe("Primitive extension metadata survival", function () {
        beforeEach(async function () {
            ensureResourceModel("Patient");
            await mongoose.model("Patient").deleteMany({});
        });

        it("preserves _birthDate and nested _start metadata through normalization and serialization", async function () {
            const created = await createPatientViaCreateService(primitiveExtensionPatientBody());

            expect(created.status, JSON.stringify(created.result)).to.equal(true);
            expect(created.result.id).to.be.a("string").and.not.empty;
            expectPublicTemporalScalars(created.result);
            expect(created.result).to.not.have.property("_birthDate");
            expectUntouchedElementMetadata(
                created.result.meta._lastUpdated,
                "create meta._lastUpdated"
            );
            expectUntouchedElementMetadata(
                created.result.contact[0].period._start,
                "create period._start"
            );

            const stored = await mongoose.model("Patient").findOne({ id: created.result.id }).lean();
            expect(stored).to.not.equal(null);
            expect(stored).to.not.have.property("_birthDate");
            expect(stored.birthDate).to.deep.include({
                value: BIRTH_DATE,
                precision: DATE_PRECISION.YEAR,
                normalizedStart: "1995-01-01",
                normalizedEnd: "1996-01-01"
            });
            expect(stored.contact[0].period.start.value).to.equal(PERIOD_START);
            expect(stored.contact[0].period.start.precision).to.equal(DATETIME_PRECISION.MONTH);
            expectUntouchedElementMetadata(stored.meta._lastUpdated, "stored meta._lastUpdated");
            expectUntouchedElementMetadata(stored.contact[0].period._start, "stored period._start");

            const readCall = readPatientViaReadService(created.result.id);
            const read = await readCall.read();
            expect(read.status, JSON.stringify(read.result)).to.equal(true);
            expectPublicTemporalScalars(read.result);
            expect(read.result).to.not.have.property("_birthDate");
            expectUntouchedElementMetadata(read.result.meta._lastUpdated, "read meta._lastUpdated");
            expectUntouchedElementMetadata(
                read.result.contact[0].period._start,
                "read period._start"
            );
        });

        it("treats canonical birthDate as present for :missing=false after primitive extension write", async function () {
            const created = await createPatientViaCreateService(primitiveExtensionPatientBody());
            expect(created.status).to.equal(true);

            const stored = await mongoose.model("Patient").findOne({ id: created.result.id }).lean();
            const plan = buildTemporalPlan("birthDate", "date", [], "date");
            const presentFilter = executeSearchQueryPlan(plan, "false", "birthdate:missing");
            const missingFilter = executeSearchQueryPlan(plan, "true", "birthdate:missing");

            expect(presentFilter).to.satisfy((filter) =>
                JSON.stringify(filter).includes("birthDate.normalizedStart")
            );
            const presentIds = (
                await mongoose.connection.collection("Patient").find(presentFilter).toArray()
            )
                .map((document) => document.id)
                .sort();
            const missingIds = (
                await mongoose.connection.collection("Patient").find(missingFilter).toArray()
            )
                .map((document) => document.id)
                .sort();

            expect(presentIds).to.deep.equal([stored.id]);
            expect(missingIds).to.deep.equal([]);
        });
    });
});
