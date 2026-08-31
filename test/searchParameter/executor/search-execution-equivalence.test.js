require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const {
    createTypedFilterPlan
} = require("@models/FHIR/searchParameter/executor/queryValueParser");
const {
    applyPlanToQuery
} = require("@models/FHIR/searchParameter/executor/mongoExecutor");
const {
    buildRelationAggregation
} = require("@models/FHIR/searchParameter/executor/relationPlan");
const { createSearchQueryPlan } = require("@models/FHIR/searchParameter/compiler/searchQueryPlan");
const { SearchProcessor } = require("@root/api/FHIRApiService/search/searchProcessor");

function temporalPlan(datatype, searchType = "date") {
    return createSearchQueryPlan({
        resourceType: "Observation",
        code: "effective",
        searchType,
        extractionPaths: [{ path: "effective", datatype }]
    });
}

describe("typed temporal search execution", function () {
    it("passes one typed filter to find and aggregate execution", async function () {
        const plan = temporalPlan("dateTime", "dateTime");
        const filterPlan = createTypedFilterPlan(
            plan,
            "ge2020-01-01T00:00:00.123456789Z",
            "effective"
        );
        const query = { $and: [filterPlan.filter] };
        const calls = {};
        const execution = {
            find: async (options) => {
                calls.find = options;
                return [];
            },
            aggregate: async (options) => {
                calls.aggregate = options;
                return [];
            },
            count: async () => 0
        };
        const modelName = "TypedTemporalSearchExecutionProbe";
        if (!mongoose.models[modelName]) {
            mongoose.model(modelName, new mongoose.Schema({}, { strict: false }));
        }

        await new SearchProcessor({
            resourceType: modelName,
            isChain: false,
            query,
            skip: 0,
            limit: 10,
            totalMode: "none",
            execution
        }).search();

        await new SearchProcessor({
            resourceType: modelName,
            isChain: true,
            query: {
                $and: [filterPlan.filter],
                isChain: true,
                chain: [[]]
            },
            skip: 0,
            limit: 10,
            totalMode: "none",
            execution
        }).search();

        expect(calls.find.filter.$and[0]).to.equal(filterPlan.filter);
        expect(calls.aggregate.filter.$and[0]).to.equal(filterPlan.filter);
        expect(calls.aggregate.pipeline[0].$match.$and[0]).to.equal(filterPlan.filter);
        expect(
            filterPlan.filter.$or[1]["effective.normalizedStart"].$gte
        ).to.be.instanceOf(
            mongoose.Types.Decimal128
        );
    });

    it("reuses the typed plan in a chained lookup without parsing its value again", function () {
        const targetPlan = temporalPlan("date", "date");
        const parser = require("@models/FHIR/searchParameter/executor/temporalQueryParser");
        const original = parser.parseTemporalQueryValue;
        let calls = 0;
        parser.parseTemporalQueryValue = function (...args) {
            calls += 1;
            return original(...args);
        };

        try {
            const filterPlan = createTypedFilterPlan(targetPlan, "2015-02", "birthdate");
            const relationPlan = {
                sourcePlan: {
                    extractionPaths: [{ path: "subject", datatype: "Reference" }]
                },
                targetPlan,
                targetResourceTypes: ["Patient"],
                targetParameter: "birthdate",
                depth: 1,
                estimatedCost: 1
            };
            const aggregation = buildRelationAggregation(relationPlan, filterPlan);
            const lookup = aggregation.chain[0].find((stage) => stage.$lookup).$lookup;

            expect(calls).to.equal(1);
            expect(lookup.pipeline[1].$match).to.equal(filterPlan.filter);
            expect(filterPlan.filter["effective.normalizedStart"]).to.deep.equal({
                $gte: "2015-02-01"
            });
        } finally {
            parser.parseTemporalQueryValue = original;
        }
    });

    it("builds one BSON-typed filter for date, dateTime, and instant", function () {
        const cases = [
            {
                datatype: "date",
                searchType: "date",
                value: "2020",
                field: "effective.normalizedStart",
                type: "string"
            },
            {
                datatype: "dateTime",
                searchType: "date",
                value: "2020",
                field: "effective.normalizedStart",
                type: "decimal"
            },
            {
                datatype: "instant",
                searchType: "date",
                value: "2020-01-01",
                field: "effective.epochSeconds",
                type: "decimal"
            }
        ];

        for (const testCase of cases) {
            const filterPlan = createTypedFilterPlan(
                temporalPlan(testCase.datatype, testCase.searchType),
                testCase.value,
                "effective"
            );
            const value = Object.values(filterPlan.filter[testCase.field])[0];
            if (testCase.type === "decimal") {
                expect(value).to.be.instanceOf(mongoose.Types.Decimal128);
            } else {
                expect(value).to.be.a("string");
            }
        }
    });

    it("parses a multi-branch temporal query once", function () {
        const parser = require("@models/FHIR/searchParameter/executor/temporalQueryParser");
        const original = parser.parseTemporalQueryValue;
        let calls = 0;
        parser.parseTemporalQueryValue = function (...args) {
            calls += 1;
            return original(...args);
        };

        try {
            const plan = createSearchQueryPlan({
                resourceType: "Observation",
                code: "effective",
                searchType: "date",
                extractionPaths: [
                    { path: "effectiveDate", datatype: "date" },
                    { path: "effectiveDateTime", datatype: "dateTime" }
                ]
            });
            const filterPlan = createTypedFilterPlan(plan, "2020-02", "effective");
            expect(calls).to.equal(1);
            expect(filterPlan.parsed.groups[0][0].temporal).to.exist;
        } finally {
            parser.parseTemporalQueryValue = original;
        }
    });

    it("keeps the existing Period and missing filters typed", function () {
        const periodPlan = createSearchQueryPlan({
            resourceType: "Observation",
            code: "effective",
            searchType: "date",
            extractionPaths: [{ path: "effective", datatype: "Period" }]
        });
        const period = createTypedFilterPlan(periodPlan, "2015", "effective");
        const periodStart = period.filter.$and[0].$or[0]["effective.start.normalizedStart"];
        expect(periodStart.$lte).to.be.instanceOf(mongoose.Types.Decimal128);

        const missing = createTypedFilterPlan(periodPlan, "true", "effective:missing");
        expect(missing.filter.$nor).to.exist;
    });
});
