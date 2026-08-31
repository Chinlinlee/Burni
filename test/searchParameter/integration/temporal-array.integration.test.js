require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const { compileDefinition } = require("@models/FHIR/searchParameter/compiler/compiler");
const { executeSearchQueryPlan } = require("@models/FHIR/searchParameter/executor/mongoExecutor");
const {
    startMongoMemory,
    dropMongoTestDatabase,
    stopMongoMemory
} = require("../../support/mongo-memory");

const COMPARATORS = ["eq", "ne", "lt", "gt", "ge", "le", "sa", "eb", "ap"];

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

function decimal(value) {
    return mongoose.Types.Decimal128.fromString(String(value));
}

function dateTime(start, end = Number(start) + 1) {
    return {
        value: "2020-01-01T00:00:00Z",
        precision: "second",
        normalizedStart: decimal(start),
        normalizedEnd: decimal(end)
    };
}

function period(start, end) {
    return {
        start: dateTime(start),
        end: dateTime(end)
    };
}

async function queryCollection(collectionName, filter) {
    return mongoose.connection.collection(collectionName).find(filter).toArray();
}

async function seedCollection(collectionName, documents) {
    const collection = mongoose.connection.collection(collectionName);
    await collection.drop().catch(() => undefined);
    await collection.insertMany(documents);
}

describe("Temporal array search execution", function () {
    before(async function () {
        this.timeout(120000);
        await startMongoMemory();
    });

    after(async function () {
        await dropMongoTestDatabase();
        await stopMongoMemory();
        await mongoose.disconnect();
    });

    it("uses one elemMatch for scalar temporal arrays and preserves Decimal128 boundaries", function () {
        const plan = buildTemporalPlan("events", "dateTime", ["events"], "dateTime");
        const filter = executeSearchQueryPlan(plan, "2020-01-01T00:00:00Z", "events");
        const elementFilter = filter.events.$elemMatch;

        expect(filter).to.have.nested.property("events.$elemMatch");
        expect(elementFilter).to.have.property("normalizedStart");
        expect(elementFilter).to.have.property("normalizedEnd");
        expect(elementFilter.normalizedStart.$gte).to.be.instanceOf(
            mongoose.Types.Decimal128
        );
        expect(elementFilter.normalizedEnd.$lte).to.be.instanceOf(
            mongoose.Types.Decimal128
        );
        expect(filter.events.normalizedStart).to.equal(undefined);
        expect(filter.events.normalizedEnd).to.equal(undefined);
    });

    it("correlates both boundaries for a Period array", function () {
        const plan = buildTemporalPlan("periods", "Period", ["periods"], "dateTime");
        const filter = executeSearchQueryPlan(plan, "2020-01-01T00:00:00Z", "periods");
        const elementFilter = filter.periods.$elemMatch;

        expect(elementFilter.$and[0].$or[0]).to.have.property("start.normalizedStart");
        expect(elementFilter.$and[1].$or[0]).to.have.property("end.normalizedEnd");
        expect(
            elementFilter.$and[0].$or[0]["start.normalizedStart"].$lte
        ).to.be.instanceOf(mongoose.Types.Decimal128);
        expect(
            elementFilter.$and[1].$or[0]["end.normalizedEnd"].$gte
        ).to.be.instanceOf(mongoose.Types.Decimal128);
    });

    it("wraps nested temporal arrays from compiler extraction metadata", function () {
        const definition = {
            resource: {
                resourceType: "SearchParameter",
                url: "http://example.org/SearchParameter/contact-period",
                version: "4.0.1",
                status: "active",
                code: "contact-period",
                base: ["Patient"],
                type: "date",
                expression: "Patient.contact.telecom.period"
            },
            canonicalKey: "http://example.org/SearchParameter/contact-period::4.0.1",
            lookupKeys: ["Patient::contact-period"]
        };
        const result = compileDefinition(definition);
        const plan = result.lookupPlans["Patient::contact-period"].plan;
        const filter = executeSearchQueryPlan(plan, "2020", "contact-period");

        expect(plan.extractionPaths).to.deep.equal([
            {
                path: "contact.telecom.period",
                datatype: "Period",
                arrayPaths: ["contact", "contact.telecom"]
            }
        ]);
        expect(filter).to.have.nested.property("contact.$elemMatch.telecom.$elemMatch");
        expect(filter.contact.$elemMatch.telecom.$elemMatch).to.have.property("$and");
    });

    it("does not combine separate scalar temporal elements", async function () {
        const plan = buildTemporalPlan("events", "dateTime", ["events"], "dateTime");
        const filter = executeSearchQueryPlan(plan, "2020-01-01T00:00:00Z", "events");
        const collectionName = "temporal_array_scalar";
        await mongoose.connection.collection(collectionName).drop().catch(() => undefined);
        await mongoose.connection.collection(collectionName).insertMany([
            {
                role: "cross-element",
                events: [
                    { normalizedStart: decimal("1577836800"), normalizedEnd: decimal("1577836810") },
                    { normalizedStart: decimal("1577836790"), normalizedEnd: decimal("1577836801") }
                ]
            },
            {
                role: "same-element",
                events: [
                    { normalizedStart: decimal("1577836800"), normalizedEnd: decimal("1577836801") }
                ]
            }
        ]);

        const matches = await queryCollection(collectionName, filter);
        expect(matches.map((entry) => entry.role)).to.deep.equal(["same-element"]);
    });

    it("correlates nested temporal array elements", async function () {
        const plan = buildTemporalPlan("groups.events", "dateTime", [
            "groups",
            "groups.events"
        ], "dateTime");
        const filter = executeSearchQueryPlan(plan, "2020-01-01T00:00:00Z", "groups.events");
        const collectionName = "temporal_array_nested";
        await mongoose.connection.collection(collectionName).drop().catch(() => undefined);
        await mongoose.connection.collection(collectionName).insertMany([
            {
                role: "cross-element",
                groups: [
                    {
                        events: [
                            {
                                normalizedStart: decimal("1577836800"),
                                normalizedEnd: decimal("1577836810")
                            }
                        ]
                    },
                    {
                        events: [
                            {
                                normalizedStart: decimal("1577836790"),
                                normalizedEnd: decimal("1577836801")
                            }
                        ]
                    }
                ]
            },
            {
                role: "same-element",
                groups: [
                    {
                        events: [
                            {
                                normalizedStart: decimal("1577836800"),
                                normalizedEnd: decimal("1577836801")
                            }
                        ]
                    }
                ]
            }
        ]);

        const matches = await queryCollection(collectionName, filter);
        expect(matches.map((entry) => entry.role)).to.deep.equal(["same-element"]);
    });

    it("correlates Period start and end in one array element", async function () {
        const plan = buildTemporalPlan("periods", "Period", ["periods"], "dateTime");
        const filter = executeSearchQueryPlan(plan, "2020-01-01T00:00:00Z", "periods");
        const collectionName = "temporal_array_period";
        await mongoose.connection.collection(collectionName).drop().catch(() => undefined);
        await mongoose.connection.collection(collectionName).insertMany([
            {
                role: "cross-element",
                periods: [
                    {
                        start: { normalizedStart: decimal("1577836790") },
                        end: { normalizedEnd: decimal("1577836800") }
                    },
                    {
                        start: { normalizedStart: decimal("1577836801") },
                        end: { normalizedEnd: decimal("1577836810") }
                    }
                ]
            },
            {
                role: "same-element",
                periods: [
                    {
                        start: { normalizedStart: decimal("1577836790") },
                        end: { normalizedEnd: decimal("1577836810") }
                    }
                ]
            }
        ]);

        const matches = await queryCollection(collectionName, filter);
        expect(matches.map((entry) => entry.role)).to.deep.equal(["same-element"]);
    });

    it("keeps choice branches equivalent in find and aggregate execution", async function () {
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
        const collectionName = "temporal_choice_execution";
        await seedCollection(collectionName, [
            { role: "dateTime", effectiveDateTime: dateTime("1577836800") },
            {
                role: "period",
                effectivePeriod: period("1577836790", "1577923210")
            },
            { role: "instant", effectiveInstant: { epochSeconds: decimal("1577836800") } },
            {
                role: "raw",
                effectiveDateTime: { value: "2020-01-01T00:00:00Z" }
            }
        ]);

        const findMatches = await queryCollection(collectionName, filter);
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

    it("searches canonical temporal values in contained resources and history snapshots", async function () {
        const containedPlan = buildTemporalPlan(
            "contained.effectiveDateTime",
            "dateTime",
            ["contained"],
            "date"
        );
        const containedFilter = executeSearchQueryPlan(
            containedPlan,
            "2020-01-01",
            "contained-date"
        );
        const containedCollection = "temporal_contained_coverage";
        await seedCollection(containedCollection, [
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
            }
        ]);
        const containedMatches = await queryCollection(containedCollection, containedFilter);
        expect(containedMatches.map((entry) => entry.role)).to.deep.equal(["contained-hit"]);

        const historyPlan = buildTemporalPlan("birthDate", "date", [], "date");
        const historyFilter = executeSearchQueryPlan(historyPlan, "2020-01-01", "birthdate");
        const historyCollection = "Patient_history_temporal_coverage";
        await seedCollection(historyCollection, [
            {
                role: "history-hit",
                meta: { versionId: "1" },
                birthDate: {
                    value: "2020-01-01",
                    precision: "day",
                    normalizedStart: "2020-01-01",
                    normalizedEnd: "2020-01-02"
                }
            },
            {
                role: "history-raw",
                meta: { versionId: "2" },
                birthDate: "2020-01-01"
            }
        ]);
        const historyMatches = await queryCollection(historyCollection, historyFilter);
        expect(historyMatches.map((entry) => entry.role)).to.deep.equal(["history-hit"]);
    });

    it("uses canonical completeness for choice missing searches", async function () {
        const plan = buildTemporalPlan("effectiveDateTime", "dateTime", [], "date");
        plan.extractionPaths = [
            { path: "effectiveDateTime", datatype: "dateTime" },
            { path: "effectiveInstant", datatype: "instant" }
        ];
        const collectionName = "temporal_choice_missing";
        await seedCollection(collectionName, [
            { role: "dateTime", effectiveDateTime: dateTime("1577836800") },
            {
                role: "instant",
                effectiveInstant: {
                    value: "2020-01-01T00:00:00Z",
                    precision: "second",
                    epochSeconds: decimal("1577836800")
                }
            },
            { role: "incomplete", effectiveDateTime: { value: "2020-01-01T00:00:00Z" } },
            { role: "missing" }
        ]);

        const missingFilter = executeSearchQueryPlan(plan, "true", "effective:missing");
        const presentFilter = executeSearchQueryPlan(plan, "false", "effective:missing");
        const missingMatches = await queryCollection(collectionName, missingFilter);
        const presentMatches = await queryCollection(collectionName, presentFilter);

        expect(missingMatches.map((entry) => entry.role).sort()).to.deep.equal([
            "incomplete",
            "missing"
        ]);
        expect(presentMatches.map((entry) => entry.role).sort()).to.deep.equal([
            "dateTime",
            "instant"
        ]);
    });
});
