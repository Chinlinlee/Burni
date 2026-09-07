require("module-alias/register");

const { expect } = require("chai");
const { loadBuiltinDefinitions } = require("@models/FHIR/searchParameter/registry/sourceAdapter");
const { compileDefinition } = require("@models/FHIR/searchParameter/compiler/compiler");
const {
    deriveSystemExtractionPaths
} = require("@models/FHIR/searchParameter/compiler/extractionPathCompiler");

function findBuiltinDefinition(code) {
    const { definitions } = loadBuiltinDefinitions();
    return definitions.find((definition) => definition.resource.code === code);
}

describe("FHIR system search parameter compiler", function () {
    it("compiles _id to the logical resource id field", function () {
        const definition = findBuiltinDefinition("_id");
        const compiled = compileDefinition(definition);
        const lookup = compiled.lookupPlans["Resource::_id"];

        expect(lookup.compilable).to.equal(true);
        expect(lookup.plan.searchType).to.equal("token");
        expect(lookup.plan.extractionPaths).to.deep.equal([
            { path: "id", datatype: "id" }
        ]);
    });

    it("compiles _lastUpdated to the canonical instant projection", function () {
        const definition = findBuiltinDefinition("_lastUpdated");
        const compiled = compileDefinition(definition);
        const lookup = compiled.lookupPlans["Resource::_lastUpdated"];

        expect(lookup.compilable).to.equal(true);
        expect(lookup.plan.searchType).to.equal("date");
        expect(lookup.plan.extractionPaths).to.deep.equal([
            { path: "meta.lastUpdated", datatype: "instant" }
        ]);
        expect(lookup.plan.comparators).to.deep.equal([
            "eq",
            "ne",
            "gt",
            "ge",
            "lt",
            "le",
            "sa",
            "eb",
            "ap"
        ]);
    });

    it("derives system paths without requiring a Resource type map", function () {
        expect(deriveSystemExtractionPaths({ code: "_id" }, null)).to.deep.equal([
            { path: "id", datatype: "id" }
        ]);
        expect(
            deriveSystemExtractionPaths({ code: "_lastUpdated" }, null)
        ).to.deep.equal([{ path: "meta.lastUpdated", datatype: "instant" }]);
    });
});
