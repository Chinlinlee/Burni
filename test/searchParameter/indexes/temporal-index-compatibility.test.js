require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const { createSearchQueryPlan } = require("@models/FHIR/searchParameter/compiler/searchQueryPlan");
const { createTemporalIndexEntry, createTemporalIndexManifest } = require("@models/FHIR/searchParameter/indexes/indexManifest");
const { generateTemporalIndexManifest } = require("@models/FHIR/searchParameter/indexes/indexGenerator");
const {
    createDryRunExplainAdapter,
    createMongoExplainAdapter,
    validateTemporalFilterAgainstIndex,
    validateTemporalIndexCompatibility,
    validateTemporalIndexEntryCompatibility,
    validateTemporalPlanIndexCompatibility,
    verifyTemporalExecutionModes,
    verifyTemporalQueryExplain
} = require("@models/FHIR/searchParameter/indexes/indexCompatibility");
const { createTypedFilterPlan } = require("@models/FHIR/searchParameter/executor/queryValueParser");

function definition(plan) {
    return {
        canonicalKey: `http://example.org/SearchParameter/${plan.code}::4.0.1`,
        effectiveStatus: "active",
        resource: {
            code: plan.code,
            resourceType: "SearchParameter"
        },
        lookupPlans: {
            [`${plan.resourceType}::${plan.code}`]: {
                compilable: true,
                plan
            }
        }
    };
}

function temporalPlan(extractionPaths, searchType = "date", code = "effective") {
    return createSearchQueryPlan({
        resourceType: "Observation",
        code,
        searchType,
        extractionPaths,
        comparators: ["eq", "ne", "lt", "gt", "ge", "le", "sa", "eb", "ap"]
    });
}

function buildChoicePlan() {
    return temporalPlan([
        { path: "effectiveDateTime", datatype: "dateTime" },
        { path: "effectivePeriod", datatype: "Period" },
        { path: "effectiveInstant", datatype: "instant" }
    ]);
}

function buildChoiceManifest(plan = buildChoicePlan()) {
    return generateTemporalIndexManifest([definition(plan)]);
}

describe("temporal Mongo index compatibility", function () {
    it("validates Period and array index keys with correlated filters", function () {
        const plan = temporalPlan([
            {
                path: "activity.detail.scheduledPeriod",
                datatype: "Period",
                arrayPaths: ["activity"]
            }
        ]);
        plan.resourceType = "CarePlan";
        const manifest = generateTemporalIndexManifest([definition(plan)]);
        const filterPlan = createTypedFilterPlan(plan, "2020", "effective");
        const result = validateTemporalPlanIndexCompatibility({
            manifest,
            plan,
            filter: filterPlan.filter
        });

        expect(result.valid).to.equal(true);
        expect(result.entries[0].fields).to.deep.equal([
            "activity.detail.scheduledPeriod.start.normalizedStart",
            "activity.detail.scheduledPeriod.end.normalizedEnd"
        ]);
        expect(result.filterEvidence.elemMatchPaths.has("activity")).to.equal(true);
        expect(result.indexNames).to.have.length(1);
    });

    it("reports parallel multikey paths instead of accepting an incompatible compound index", function () {
        const entry = createTemporalIndexEntry(
            "Observation",
            definition(
                temporalPlan([{ path: "effectivePeriod", datatype: "Period" }])
            ),
            "Observation::effective",
            {
                path: "periods",
                datatype: "Period",
                arrayPaths: ["periods", "otherPeriods"]
            }
        );
        const result = validateTemporalIndexEntryCompatibility(entry);

        expect(result.valid).to.equal(false);
        expect(result.diagnostics.map((entry) => entry.code)).to.include(
            "parallel-multikey-paths"
        );
        expect(result.diagnostics.map((entry) => entry.code)).to.include(
            "temporal-index-array-path-mismatch"
        );
        const manifestResult = validateTemporalIndexCompatibility(
            createTemporalIndexManifest([entry])
        );
        expect(manifestResult.valid).to.equal(false);
        expect(manifestResult.diagnostics.map((entry) => entry.code)).to.include(
            "index-manifest-invalid"
        );
    });

    it("keeps choice branches as independent indexes", function () {
        const plan = buildChoicePlan();
        const manifest = buildChoiceManifest(plan);
        const entries = manifest.indexes;
        const filterPlan = createTypedFilterPlan(plan, "2020", "effective");
        const result = validateTemporalPlanIndexCompatibility({
            manifest,
            plan,
            filter: filterPlan.filter
        });

        expect(result.valid).to.equal(true);
        expect(entries).to.have.length(3);
        expect(entries.every((entry) => entry.compatibility.choice.compound === false)).to.equal(
            true
        );
        expect(new Set(result.indexNames).size).to.equal(3);
    });

    it("reports Decimal128 and calendar BSON type mismatches", function () {
        const decimalPlan = temporalPlan(
            [{ path: "effectiveDateTime", datatype: "dateTime" }],
            "dateTime"
        );
        const manifest = generateTemporalIndexManifest([definition(decimalPlan)]);
        const filter = createTypedFilterPlan(
            decimalPlan,
            "2020-01-01T00:00:00Z",
            "effective"
        ).filter;
        filter["effectiveDateTime.normalizedStart"].$gte = "1577836800";

        const result = validateTemporalFilterAgainstIndex(manifest.indexes[0], filter);

        expect(result.valid).to.equal(false);
        expect(result.diagnostics[0].code).to.equal("temporal-filter-bson-type-mismatch");

        const calendarPlan = temporalPlan([{ path: "birthDate", datatype: "date" }]);
        calendarPlan.resourceType = "Patient";
        calendarPlan.code = "birthdate";
        const calendarManifest = generateTemporalIndexManifest([definition(calendarPlan)]);
        const calendarFilter = createTypedFilterPlan(calendarPlan, "2020", "effective").filter;
        calendarFilter["birthDate.normalizedStart"].$gte = mongoose.Types.Decimal128.fromString(
            "2020"
        );
        const calendarResult = validateTemporalFilterAgainstIndex(
            calendarManifest.indexes[0],
            calendarFilter
        );

        expect(calendarResult.valid).to.equal(false);
        expect(calendarResult.diagnostics[0].code).to.equal(
            "temporal-filter-bson-type-mismatch"
        );
    });

    it("rejects raw temporal value comparisons without rejecting canonical presence checks", function () {
        const plan = temporalPlan([{ path: "effectiveDateTime", datatype: "dateTime" }]);
        const manifest = generateTemporalIndexManifest([definition(plan)]);
        const rawFilter = {
            "effectiveDateTime.value": { $eq: "2020-01-01T00:00:00Z" }
        };
        const rawResult = validateTemporalFilterAgainstIndex(manifest.indexes[0], rawFilter);
        expect(rawResult.valid).to.equal(false);
        expect(rawResult.diagnostics.map((entry) => entry.code)).to.include(
            "raw-temporal-value-filter"
        );

        const presenceFilter = {
            $and: [
                {
                    "effectiveDateTime.value": {
                        $exists: true,
                        $type: "string",
                        $regex: /^\d{4}-\d{2}-\d{2}/
                    }
                },
                {
                    "effectiveDateTime.normalizedStart": {
                        $exists: true,
                        $type: "decimal"
                    }
                }
            ]
        };
        expect(validateTemporalFilterAgainstIndex(manifest.indexes[0], presenceFilter).valid).to.equal(
            true
        );
    });

    it("rejects a choice plan when one branch has no index", function () {
        const plan = buildChoicePlan();
        const manifest = buildChoiceManifest(plan);
        manifest.indexes = manifest.indexes.filter(
            (entry) => entry.extractionPath !== "effectiveInstant"
        );
        manifest.indexCount = manifest.indexes.length;
        const filter = createTypedFilterPlan(plan, "2020", "effective").filter;
        const result = validateTemporalPlanIndexCompatibility({ manifest, plan, filter });

        expect(result.valid).to.equal(false);
        expect(result.diagnostics.map((entry) => entry.code)).to.include(
            "missing-temporal-index"
        );
        expect(result.diagnostics.map((entry) => entry.code)).to.include(
            "incomplete-choice-index-set"
        );
    });

    it("does not require a temporal index for non-temporal plans", function () {
        const plan = temporalPlan([{ path: "code", datatype: "code" }], "string", "status");
        const manifest = createTemporalIndexManifest([]);
        const result = validateTemporalIndexCompatibility(manifest, { plans: [plan] });

        expect(result.valid).to.equal(true);
        expect(result.diagnostics).to.deep.equal([]);
        expect(result.indexNames).to.deep.equal([]);
    });

    it("verifies a deterministic dry-run winning plan", async function () {
        const plan = temporalPlan([{ path: "effectiveDateTime", datatype: "dateTime" }]);
        const manifest = generateTemporalIndexManifest([definition(plan)]);
        const result = await verifyTemporalQueryExplain({
            manifest,
            plan,
            rawValue: "2020",
            parameterName: "effective",
            dryRun: true
        });

        expect(result.valid).to.equal(true);
        expect(result.explain.dryRun).to.equal(true);
        expect(result.winningPlan.stage).to.equal("IXSCAN");
        expect(result.usedIndexNames).to.deep.equal(result.indexNames);
    });

    it("reports a winning plan that uses an unrelated index", async function () {
        const plan = temporalPlan([{ path: "effectiveDateTime", datatype: "dateTime" }]);
        const manifest = generateTemporalIndexManifest([definition(plan)]);
        const result = await verifyTemporalQueryExplain({
            manifest,
            plan,
            rawValue: "2020",
            parameterName: "effective",
            explainAdapter: () => ({
                queryPlanner: {
                    winningPlan: {
                        stage: "IXSCAN",
                        indexName: "unrelated_index"
                    }
                }
            })
        });

        expect(result.valid).to.equal(false);
        expect(result.diagnostics.map((entry) => entry.code)).to.include(
            "explain-index-mismatch"
        );
    });

    it("uses the same filter and index metadata for find, aggregate, and chained modes", async function () {
        const plan = buildChoicePlan();
        const manifest = buildChoiceManifest(plan);
        const requests = [];
        const result = await verifyTemporalExecutionModes({
            manifest,
            plan,
            rawValue: "2020",
            parameterName: "effective",
            explainAdapter: async (request) => {
                requests.push(request);
                return {
                    queryPlanner: {
                        winningPlan: {
                            stage: "IXSCAN",
                            indexName: request.indexNames[0]
                        }
                    }
                };
            }
        });

        expect(result.valid).to.equal(true);
        expect(requests.map((request) => request.executionMode)).to.deep.equal([
            "find",
            "aggregate",
            "chained"
        ]);
        expect(new Set(requests.map((request) => JSON.stringify(request.indexNames))).size).to.equal(
            1
        );
        expect(requests[0].filter).to.equal(requests[1].filter);
        expect(requests[1].filter).to.equal(requests[2].filter);
    });

    it("provides a Mongo collection explain adapter for find and aggregate", async function () {
        const calls = [];
        const collection = {
            find(filter) {
                calls.push({ kind: "find", filter });
                return {
                    explain: async (verbosity) => ({ verbosity, queryPlanner: { winningPlan: {} } })
                };
            },
            aggregate(pipeline) {
                calls.push({ kind: "aggregate", pipeline });
                return {
                    explain: async (verbosity) => ({ verbosity, queryPlanner: { winningPlan: {} } })
                };
            }
        };
        const adapter = createMongoExplainAdapter(collection, { verbosity: "queryPlanner" });
        const filter = { "effective.normalizedStart": { $gte: "2020-01-01" } };

        const findExplain = await adapter({ executionMode: "find", filter });
        const aggregateExplain = await adapter({
            executionMode: "aggregate",
            filter,
            pipeline: [{ $match: filter }]
        });

        expect(findExplain.verbosity).to.equal("queryPlanner");
        expect(aggregateExplain.verbosity).to.equal("queryPlanner");
        expect(calls).to.deep.equal([
            { kind: "find", filter },
            { kind: "aggregate", pipeline: [{ $match: filter }] }
        ]);
    });

    it("reports unsupported explain conditions explicitly", async function () {
        const plan = temporalPlan([{ path: "effectiveDateTime", datatype: "dateTime" }]);
        const manifest = generateTemporalIndexManifest([definition(plan)]);
        const result = await verifyTemporalQueryExplain({
            manifest,
            plan,
            rawValue: "2020",
            parameterName: "effective",
            explainAdapter: () => ({
                unsupportedConditions: ["sharded lookup explain is unavailable"],
                queryPlanner: {
                    winningPlan: {
                        stage: "IXSCAN",
                        indexName: manifest.indexes[0].name
                    }
                }
            })
        });

        expect(result.valid).to.equal(false);
        expect(result.diagnostics.map((entry) => entry.code)).to.include(
            "explain-unsupported-condition"
        );
    });
});
