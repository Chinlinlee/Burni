require("module-alias/register");

const { expect } = require("chai");
const { compileDefinition } = require("@models/FHIR/searchParameter/compiler/compiler");
const { loadBuiltinDefinitions } = require("@models/FHIR/searchParameter/registry/sourceAdapter");
const productionResources = require("@models/FHIR/fhir.resourceList.json");

function buildDefinition(overrides = {}) {
    return {
        resource: {
            resourceType: "SearchParameter",
            url: "http://example.org/SearchParameter/test",
            version: "4.0.1",
            status: "active",
            code: "test",
            base: ["Patient"],
            type: "string",
            expression: "Patient.name",
            ...overrides.resource
        },
        source: "builtin-bundle",
        canonicalKey: "http://example.org/SearchParameter/test::4.0.1",
        lookupKeys: overrides.lookupKeys || ["Patient::test"],
        rawStatus: "active",
        effectiveStatus: "disabled",
        diagnostics: []
    };
}

describe("Unsupported SearchParameter classification", function () {
    it("classifies composite as a stable unsupported lookup", function () {
        const compiled = compileDefinition(
            buildDefinition({
                resource: { type: "composite", expression: "Patient.name" }
            })
        );
        expect(compiled.compilable).to.equal(false);
        expect(compiled.lookupPlans["Patient::test"].compilable).to.equal(false);
        expect(compiled.lookupPlans["Patient::test"].reason).to.include("Unsupported search type");
        expect(compiled.diagnostics.some((entry) => entry.code === "unsupported-type")).to.equal(
            true
        );
        expect(compiled.lookupPlans["Patient::test"].plan).to.equal(undefined);
    });

    it("classifies special as a stable unsupported lookup", function () {
        const compiled = compileDefinition(
            buildDefinition({
                resource: { type: "special", expression: "Patient.name" }
            })
        );
        expect(compiled.lookupPlans["Patient::test"].reason).to.include("Unsupported search type");
        expect(compiled.lookupPlans["Patient::test"].plan).to.equal(undefined);
    });

    it("classifies a missing expression as unsupported", function () {
        const compiled = compileDefinition(
            buildDefinition({
                resource: { expression: undefined, type: "token" }
            })
        );
        expect(compiled.compilable).to.equal(false);
        expect(compiled.lookupPlans["Patient::test"].compilable).to.equal(false);
        expect(compiled.diagnostics.some((entry) => entry.code === "missing-expression")).to.equal(
            true
        );
        expect(compiled.lookupPlans["Patient::test"].plan).to.equal(undefined);
    });

    it("classifies un-allowlisted syntax as unsupported", function () {
        const compiled = compileDefinition(
            buildDefinition({
                resource: { expression: "Observation.value.ofType(Quantity)" }
            })
        );
        expect(compiled.compilable).to.equal(false);
        expect(compiled.lookupPlans["Patient::test"].reason).to.include(
            "Unsupported expression feature"
        );
        expect(
            compiled.diagnostics.some((entry) => entry.code === "unsupported-syntax")
        ).to.equal(true);
        expect(compiled.lookupPlans["Patient::test"].plan).to.equal(undefined);
    });
});

describe("Compiler lookup outcome completeness", function () {
    it("records an explicit outcome for every production lookup", function () {
        const missing = [];

        for (const definition of loadBuiltinDefinitions().definitions) {
            const result = compileDefinition(definition);
            for (const lookupKey of definition.lookupKeys) {
                const [resourceType] = lookupKey.split("::");
                if (!productionResources.includes(resourceType)) {
                    continue;
                }
                const lookup = result.lookupPlans[lookupKey];
                if (!lookup) {
                    missing.push(`${lookupKey} has no lookupPlans entry`);
                    continue;
                }
                if (lookup.compilable) {
                    if (!lookup.plan) {
                        missing.push(`${lookupKey} is compiled without a plan`);
                    }
                    continue;
                }
                if (!lookup.reason) {
                    missing.push(`${lookupKey} is uncompiled without a reason`);
                }
                if (lookup.plan) {
                    missing.push(`${lookupKey} is uncompiled but still has a plan`);
                }
            }
        }

        expect(missing).to.deep.equal([]);
    });
});
