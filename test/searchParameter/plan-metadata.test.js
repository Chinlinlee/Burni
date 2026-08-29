require("module-alias/register");

const { expect } = require("chai");
const { compileDefinition } = require("@models/FHIR/searchParameter/compiler/compiler");
const {
    REFERENCE_VALUE_FORMS,
    deriveCorrelation,
    deriveTargets,
    attachPlanMetadata
} = require("@models/FHIR/searchParameter/compiler/planMetadata");
const { extractReferenceValues } = require("@models/FHIR/searchParameter/runtime/includeHandler");
const { parseSearchParameterName } = require("@models/FHIR/searchParameter/runtime/parameterName");

function buildDefinition(overrides = {}) {
    return {
        resource: {
            resourceType: "SearchParameter",
            url: "http://example.org/SearchParameter/test",
            version: "4.0.1",
            status: "active",
            code: "subject",
            base: ["Observation"],
            type: "reference",
            expression: "Observation.subject",
            target: ["Patient", "Group", "Device", "Location"],
            ...overrides.resource
        },
        source: "builtin-bundle",
        canonicalKey: "http://example.org/SearchParameter/test::4.0.1",
        lookupKeys: ["Observation::subject"],
        rawStatus: "active",
        effectiveStatus: "disabled",
        diagnostics: []
    };
}

describe("SearchQueryPlan reference metadata", function () {
    it("puts declared targets, extraction paths, and supported value forms on reference plans", function () {
        const compiled = compileDefinition(buildDefinition());
        const plan = compiled.lookupPlans["Observation::subject"].plan;
        expect(plan.extractionPaths).to.deep.equal([
            { path: "subject", datatype: "Reference" }
        ]);
        expect(plan.targets).to.deep.equal(["Patient", "Group", "Device", "Location"]);
        expect(plan.supportedValueForms).to.deep.equal([...REFERENCE_VALUE_FORMS]);
        expect(plan.target).to.deep.equal(["Patient", "Group", "Device", "Location"]);
    });

    it("records same-array-element correlation for resolve() type guards", function () {
        const definition = buildDefinition({
            resource: {
                code: "patient",
                base: ["Account"],
                type: "reference",
                expression: "Account.subject.where(resolve() is Patient)",
                target: ["Patient", "Device"]
            }
        });
        definition.lookupKeys = ["Account::patient"];
        const compiled = compileDefinition(definition);
        const path = compiled.lookupPlans["Account::patient"].plan.extractionPaths[0];
        expect(path.referenceTargetType).to.equal("Patient");
        expect(path.correlation).to.deep.equal({
            kind: "same-array-element",
            parentPath: "subject",
            fields: ["reference", "type"]
        });
        expect(compiled.lookupPlans["Account::patient"].plan.targets).to.include("Patient");
    });

    it("records same-array-element correlation for RelatedArtifact type predicates", function () {
        const definition = buildDefinition({
            resource: {
                code: "composed-of",
                base: ["ActivityDefinition"],
                type: "reference",
                expression: "ActivityDefinition.relatedArtifact.where(type='composed-of').resource",
                target: ["ActivityDefinition"]
            }
        });
        definition.lookupKeys = ["ActivityDefinition::composed-of"];
        const compiled = compileDefinition(definition);
        const path = compiled.lookupPlans["ActivityDefinition::composed-of"].plan.extractionPaths[0];
        expect(deriveCorrelation(path)).to.deep.equal({
            kind: "same-array-element",
            parentPath: "relatedArtifact",
            fields: ["type", "resource"]
        });
        expect(path.correlation).to.deep.equal({
            kind: "same-array-element",
            parentPath: "relatedArtifact",
            fields: ["type", "resource"]
        });
    });

    it("merges expression target guards into plan.targets", function () {
        const metadata = attachPlanMetadata(
            { target: ["Patient", "Device"] },
            [{ path: "subject", datatype: "Reference", referenceTargetType: "Patient" }],
            "reference"
        );
        expect(deriveTargets({ target: ["Patient", "Device"] }, metadata.extractionPaths)).to.deep.equal([
            "Patient",
            "Device"
        ]);
        expect(metadata.supportedValueForms).to.deep.equal(["type/id", "id", "absolute-url"]);
    });

    it("extracts correlated reference values from the same array element", function () {
        const definition = buildDefinition({
            resource: {
                code: "patient",
                base: ["Account"],
                type: "reference",
                expression: "Account.subject.where(resolve() is Patient)",
                target: ["Patient"]
            }
        });
        definition.lookupKeys = ["Account::patient"];
        const compiled = compileDefinition(definition);
        const plan = compiled.lookupPlans["Account::patient"].plan;
        const doc = {
            subject: [
                { reference: "Device/pump", type: "Device" },
                { reference: "Patient/123", type: "Patient" }
            ]
        };
        expect(extractReferenceValues(doc, plan)).to.deep.equal(["Patient/123"]);
    });

    it("parses chain, type filter, and modifier forms from parameter names", function () {
        expect(parseSearchParameterName("subject.name")).to.deep.equal({
            code: "subject",
            typeFilter: undefined,
            chain: "name",
            modifier: undefined
        });
        expect(parseSearchParameterName("subject:Patient.name")).to.deep.equal({
            code: "subject",
            typeFilter: "Patient",
            chain: "name",
            modifier: undefined
        });
        expect(parseSearchParameterName("name:exact")).to.deep.equal({
            code: "name",
            modifier: "exact",
            chain: undefined,
            typeFilter: undefined
        });
    });
});
