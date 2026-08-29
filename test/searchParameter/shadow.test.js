require("module-alias/register");

const { expect } = require("chai");
const { areFiltersEqual, normalizeValue } = require("@models/FHIR/searchParameter/runtime/queryComparator");
const { buildLegacyFilter } = require("@models/FHIR/searchParameter/runtime/legacyQueryBuilder");
const { compareWithLegacyHandler } = require("@models/FHIR/searchParameter/runtime/shadowComparison");
const { createSearchQueryPlan } = require("@models/FHIR/searchParameter/compiler/searchQueryPlan");
const {
    resetShadowDiagnostics,
    getAllSummaries
} = require("@models/FHIR/searchParameter/runtime/shadowDiagnostics");
const patientHandler = require("@root/api/FHIR/Patient/PatientParametersHandler");

describe("SearchParameter shadow comparison", function () {
    it("normalizes regex filters for comparison", function () {
        const left = { $or: [{ name: { $regex: /^smith/gi } }] };
        const right = { name: { $regex: "smith", $options: "gi" } };
        expect(areFiltersEqual(left, right)).to.equal(false);
    });

    it("builds legacy filters from generated handlers", function () {
        const result = buildLegacyFilter(patientHandler.paramsSearch, "gender", "male");
        expect(result.ok).to.equal(true);
        if (result.ok) {
            expect(result.filter).to.be.an("object");
        }
    });

    it("records match and mismatch diagnostics", async function () {
        resetShadowDiagnostics();
        const plan = createSearchQueryPlan({
            canonicalKey: "test::4.0.1",
            resourceType: "Patient",
            code: "gender",
            searchType: "token",
            extractionPaths: [{ path: "gender", datatype: "code" }],
            multipleOr: true,
            multipleAnd: true
        });

        await compareWithLegacyHandler({
            resourceType: "Patient",
            parameterName: "gender",
            queryValue: "male",
            paramsSearch: patientHandler.paramsSearch,
            plan,
            source: "batch"
        });

        const summary = getAllSummaries().find((item) => item.resourceType === "Patient");
        expect(summary).to.exist;
        expect(summary.total).to.equal(1);
        expect(summary.matched + summary.mismatched + summary.legacyError + summary.registryError).to.equal(1);
    });
});
