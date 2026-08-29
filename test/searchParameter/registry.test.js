require("module-alias/register");

const { expect } = require("chai");
const { loadBuiltinDefinitions } = require("@models/FHIR/searchParameter/registry/sourceAdapter");
const { applyActivationOverlay } = require("@models/FHIR/searchParameter/registry/activationPolicy");
const { mergeDefinitions } = require("@models/FHIR/searchParameter/registry/merge");
const { buildRegistrySnapshot, resolveLookupStatus } = require("@models/FHIR/searchParameter/registry/snapshot");
const { compileDefinition } = require("@models/FHIR/searchParameter/compiler/compiler");
const { reloadRegistry } = require("@models/FHIR/searchParameter/registry/registryManager");
const { parseFhirPath } = require("@models/FHIR/searchParameter/compiler/parserAdapter");
const { extractFieldPaths, validateAst } = require("@models/FHIR/searchParameter/compiler/astValidator");
const { validateOperator } = require("@models/FHIR/searchParameter/compiler/capabilityMatrix");
const { executeSearchQueryPlan } = require("@models/FHIR/searchParameter/executor/mongoExecutor");
const { createSearchQueryPlan } = require("@models/FHIR/searchParameter/compiler/searchQueryPlan");

describe("SearchParameter registry", function () {
    it("loads builtin bundle definitions with provenance preserved", function () {
        const { definitions } = loadBuiltinDefinitions();
        expect(definitions.length).to.be.greaterThan(1000);
        expect(definitions[0].source).to.equal("builtin-bundle");
        expect(definitions[0].resource.version).to.equal("4.0.1");
    });

    it("promotes trusted builtin draft when compilable without mutating raw status", function () {
        const definition = {
            resource: {
                resourceType: "SearchParameter",
                url: "http://example.org/SearchParameter/test",
                version: "4.0.1",
                status: "draft",
                code: "name",
                base: ["Patient"],
                type: "string",
                expression: "Patient.name"
            },
            source: "builtin-bundle",
            canonicalKey: "http://example.org/SearchParameter/test::4.0.1",
            lookupKeys: ["Patient::name"],
            rawStatus: "draft",
            effectiveStatus: "disabled",
            diagnostics: []
        };
        const activated = applyActivationOverlay(definition, { compilable: true });
        expect(activated.effectiveStatus).to.equal("active");
        expect(activated.resource.status).to.equal("draft");
    });

    it("disables conflicting active lookup keys", function () {
        const first = {
            resource: {
                resourceType: "SearchParameter",
                url: "http://example.org/a",
                version: "4.0.1",
                status: "active",
                code: "code",
                base: ["Patient"],
                type: "string",
                expression: "Patient.name"
            },
            source: "builtin-bundle",
            canonicalKey: "http://example.org/a::4.0.1",
            lookupKeys: ["Patient::code"],
            rawStatus: "active",
            effectiveStatus: "active",
            diagnostics: []
        };
        const second = {
            ...first,
            resource: {
                ...first.resource,
                url: "http://example.org/b",
                expression: "Patient.gender"
            },
            canonicalKey: "http://example.org/b::4.0.1"
        };
        const merged = mergeDefinitions([first, second]);
        const snapshot = buildRegistrySnapshot({
            definitions: merged.definitions,
            diagnostics: merged.diagnostics,
            version: 1
        });
        expect(resolveLookupStatus(snapshot, "Patient", "code")).to.equal("disabled");
        expect(snapshot.conflictLookupKeys.has("Patient::code")).to.equal(true);
    });

    it("reloads atomically and keeps a usable snapshot", async function () {
        const first = await reloadRegistry();
        const second = await reloadRegistry();
        expect(second.version).to.be.greaterThan(first.version);
        expect(second.byLookupKey.size).to.be.greaterThan(0);
    });
});

describe("FHIRPath compiler", function () {
    it("parses supported expressions", function () {
        const parsed = parseFhirPath("Patient.name");
        expect(parsed.success).to.equal(true);
        expect(extractFieldPaths(parsed.ast)).to.deep.equal(["Patient.name"]);
    });

    it("parses resolve() reference guard", function () {
        const parsed = parseFhirPath("Account.subject.where(resolve() is Patient)");
        expect(parsed.success).to.equal(true);
        expect(validateAst(parsed.ast).valid).to.equal(true);
    });

    it("parses as/ofType and union paths", function () {
        const parsed = parseFhirPath(
            "(ActivityDefinition.useContext.value as CodeableConcept)"
        );
        expect(parsed.success).to.equal(true);
        expect(extractFieldPaths(parsed.ast)[0]).to.include("CodeableConcept");
    });
});

describe("Search query plan executor", function () {
    it("rejects unsupported modifiers", function () {
        const validation = validateOperator("string", "not-a-modifier", undefined);
        expect(validation.valid).to.equal(false);
    });

    it("builds safe mongo filters from plans", function () {
        const plan = createSearchQueryPlan({
            canonicalKey: "test",
            resourceType: "Patient",
            code: "name",
            searchType: "string",
            extractionPaths: [{ path: "name", datatype: "HumanName" }],
            multipleOr: true,
            multipleAnd: true
        });
        const filter = executeSearchQueryPlan(plan, "Smith", "name");
        expect(filter).to.have.property("$or");
    });
});
