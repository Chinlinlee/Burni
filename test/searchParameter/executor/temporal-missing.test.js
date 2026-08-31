require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const {
    normalizeDate,
    normalizeDateTime,
    normalizeInstant
} = require("@models/FHIR/temporal");
const { executeSearchQueryPlan } = require("@models/FHIR/searchParameter/executor/mongoExecutor");
const {
    startMongoMemory,
    dropMongoTestDatabase,
    stopMongoMemory
} = require("../../support/mongo-memory");

function buildPlan(extractionPaths, searchType = "date") {
    return {
        estimatedCost: 1,
        searchType,
        code: "temporal",
        extractionPaths,
        comparators: []
    };
}

function canonicalValue(datatype) {
    if (datatype === "date") {
        return normalizeDate("1995-06");
    }
    if (datatype === "dateTime") {
        return normalizeDateTime("2015-02-07T13:28:17.230456789+02:00");
    }
    return normalizeInstant("2015-02-07T13:28:17.230456789+02:00");
}

function decimal128(value) {
    return mongoose.Types.Decimal128.fromString(String(value));
}

function getMissingFilter(plan, value, parameterName = "temporal:missing") {
    return executeSearchQueryPlan(plan, value, parameterName);
}

async function queryRoles(collectionName, filter) {
    const documents = await mongoose.connection.collection(collectionName).find(filter).toArray();
    return documents.map((document) => document.role).sort();
}

function fieldCondition(filter, field) {
    return filter.$and.find((entry) => Object.prototype.hasOwnProperty.call(entry, field))[field];
}

describe("Temporal missing filters", function () {
    before(async function () {
        this.timeout(120000);
        await startMongoMemory();
    });

    after(async function () {
        await dropMongoTestDatabase();
        await stopMongoMemory();
        await mongoose.disconnect();
    });

    for (const datatype of ["date", "dateTime", "instant"]) {
        it(`requires a complete canonical ${datatype} object`, async function () {
            const collectionName = `temporal_missing_${datatype}`;
            const field = "effective";
            const complete = canonicalValue(datatype);
            const partial = { value: complete.value, precision: complete.precision };
            const malformed = {
                ...complete,
                ...(datatype === "date"
                    ? { normalizedEnd: "not-a-calendar-date" }
                    : datatype === "dateTime"
                      ? { normalizedStart: new Date("2020-01-01T00:00:00.000Z") }
                      : { epochSeconds: new Date("2020-01-01T00:00:00.000Z") })
            };
            const inconsistent = {
                ...complete,
                ...(datatype === "date"
                    ? { normalizedEnd: "1995-08-01" }
                    : datatype === "dateTime"
                      ? { normalizedEnd: decimal128("0") }
                      : { epochSeconds: decimal128("0") })
            };
            const wrongDatatype =
                datatype === "date"
                    ? canonicalValue("dateTime")
                    : datatype === "dateTime"
                      ? canonicalValue("date")
                      : canonicalValue("dateTime");
            const plan = buildPlan([{ path: field, datatype }]);

            await mongoose.connection.collection(collectionName).drop().catch(() => undefined);
            await mongoose.connection.collection(collectionName).insertMany([
                { role: "complete", [field]: complete },
                { role: "partial", [field]: partial },
                { role: "malformed", [field]: malformed },
                { role: "inconsistent", [field]: inconsistent },
                { role: "wrong-datatype", [field]: wrongDatatype },
                { role: "legacy-string", [field]: complete.value },
                { role: "bson-date", [field]: new Date("2020-01-01T00:00:00.000Z") },
                { role: "null", [field]: null },
                { role: "empty-array", [field]: [] }
            ]);

            const presentFilter = getMissingFilter(plan, "false");
            const missingFilter = getMissingFilter(plan, "true");

            expect(await queryRoles(collectionName, presentFilter)).to.deep.equal(["complete"]);
            expect(await queryRoles(collectionName, missingFilter)).to.deep.equal([
                "bson-date",
                "empty-array",
                "inconsistent",
                "legacy-string",
                "malformed",
                "null",
                "partial",
                "wrong-datatype"
            ]);
            const presenceFilter = presentFilter.$or[0];
            expect(fieldCondition(presenceFilter, "effective.value").$type).to.equal("string");
            expect(fieldCondition(presenceFilter, "effective.precision").$type).to.equal(
                "string"
            );
            if (datatype === "date") {
                expect(fieldCondition(presenceFilter, "effective.normalizedStart").$type).to.equal(
                    "string"
                );
            } else if (datatype === "dateTime") {
                expect(
                    fieldCondition(presenceFilter, "effective.normalizedStart").$type
                ).to.equal("decimal");
            } else {
                expect(fieldCondition(presenceFilter, "effective.epochSeconds").$type).to.equal(
                    "decimal"
                );
            }
        });
    }

    it("keeps canonical presence correlated inside nested temporal arrays", async function () {
        const collectionName = "temporal_missing_nested_array";
        const plan = buildPlan([
            {
                path: "component.valueDateTime",
                datatype: "dateTime",
                arrayPaths: ["component"]
            }
        ]);
        const complete = normalizeDateTime("2020-01-01T00:00:00Z");

        await mongoose.connection.collection(collectionName).drop().catch(() => undefined);
        await mongoose.connection.collection(collectionName).insertMany([
            { role: "complete", component: [{ valueDateTime: complete }] },
            { role: "partial", component: [{ valueDateTime: { value: complete.value } }] },
            { role: "raw", component: [{ valueDateTime: complete.value }] },
            { role: "empty-array", component: [] },
            { role: "absent" }
        ]);

        const presentFilter = getMissingFilter(plan, "false");
        const missingFilter = getMissingFilter(plan, "true");

        const presenceFilter = presentFilter.$or[0];
        expect(presenceFilter).to.have.nested.property("component.$elemMatch");
        expect(
            fieldCondition(
                presenceFilter.component.$elemMatch,
                "valueDateTime.normalizedStart"
            ).$type
        ).to.equal("decimal");
        expect(await queryRoles(collectionName, presentFilter)).to.deep.equal(["complete"]);
        expect(await queryRoles(collectionName, missingFilter)).to.deep.equal([
            "absent",
            "empty-array",
            "partial",
            "raw"
        ]);
    });

    it("treats Period endpoints as searchable open or closed canonical bounds", async function () {
        const collectionName = "temporal_missing_period";
        const plan = buildPlan([{ path: "period", datatype: "Period" }]);
        const start = normalizeDateTime("2020-01-01T00:00:00Z");
        const end = normalizeDateTime("2020-02-01T00:00:00Z");

        await mongoose.connection.collection(collectionName).drop().catch(() => undefined);
        await mongoose.connection.collection(collectionName).insertMany([
            { role: "closed", period: { start, end } },
            { role: "open-end", period: { start } },
            { role: "open-start", period: { end } },
            { role: "empty-period", period: {} },
            { role: "partial-start", period: { start: { value: start.value } } },
            { role: "raw-start", period: { start: start.value } },
            { role: "raw-period", period: start.value },
            { role: "null", period: null },
            { role: "empty-array", period: [] }
        ]);

        const presentFilter = getMissingFilter(plan, "false");
        const missingFilter = getMissingFilter(plan, "true");

        expect(await queryRoles(collectionName, presentFilter)).to.deep.equal([
            "closed",
            "open-end",
            "open-start"
        ]);
        expect(await queryRoles(collectionName, missingFilter)).to.deep.equal([
            "empty-array",
            "empty-period",
            "null",
            "partial-start",
            "raw-period",
            "raw-start"
        ]);
    });

    it("requires one complete branch for choice paths", async function () {
        const plan = buildPlan([
            { path: "effectiveDate", datatype: "date" },
            { path: "effectiveDateTime", datatype: "dateTime" }
        ]);
        const dateValue = normalizeDate("2020");
        const dateTimeValue = normalizeDateTime("2020-01-01T00:00:00Z");
        const presentFilter = getMissingFilter(plan, "false");
        const missingFilter = getMissingFilter(plan, "true");

        expect(presentFilter).to.have.property("$or").with.lengthOf(2);
        expect(missingFilter).to.have.property("$and").with.lengthOf(2);
        expect(
            presentFilter.$or.some((branch) =>
                JSON.stringify(branch).includes("normalizedStart")
            )
        ).to.equal(true);

        const collectionName = "temporal_missing_choice";
        await mongoose.connection.collection(collectionName).drop().catch(() => undefined);
        await mongoose.connection.collection(collectionName).insertMany([
            { role: "date-complete", effectiveDate: dateValue },
            { role: "date-time-complete", effectiveDateTime: dateTimeValue },
            { role: "partial", effectiveDate: { value: dateValue.value } },
            { role: "legacy", effectiveDateTime: dateTimeValue.value },
            { role: "absent" }
        ]);

        expect(await queryRoles(collectionName, presentFilter)).to.deep.equal([
            "date-complete",
            "date-time-complete"
        ]);
        expect(await queryRoles(collectionName, missingFilter)).to.deep.equal([
            "absent",
            "legacy",
            "partial"
        ]);
    });
});
