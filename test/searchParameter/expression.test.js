require("module-alias/register");

const { expect } = require("chai");
const { parseFhirPath } = require("@models/FHIR/searchParameter/compiler/parserAdapter");
const { validateAst, extractFieldPaths } = require("@models/FHIR/searchParameter/compiler/astValidator");
const { compileDefinition } = require("@models/FHIR/searchParameter/compiler/compiler");
const {
    validateReferenceQueryValue,
    normalizeReferenceQueryValue
} = require("@models/FHIR/searchParameter/executor/referenceValueParser");

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
        lookupKeys: ["Patient::test"],
        rawStatus: "active",
        effectiveStatus: "disabled",
        diagnostics: []
    };
}

describe("FHIRPath expression fixtures", function () {
    it("parses union branches", function () {
        const parsed = parseFhirPath("Observation.code | Observation.component.code");
        expect(parsed.success).to.equal(true);
        const validation = validateAst(parsed.ast);
        expect(validation.valid).to.equal(true);
    });

    it("parses where(resolve() is Type) reference guard", function () {
        const parsed = parseFhirPath("Account.subject.where(resolve() is Patient)");
        expect(parsed.success).to.equal(true);
        const validation = validateAst(parsed.ast);
        expect(validation.valid).to.equal(true);
        expect(extractFieldPaths(parsed.ast)).to.deep.equal(["Account.subject"]);
    });

    it("parses both choice as syntax forms", function () {
        const parenForm = parseFhirPath("(Observation.value as Quantity)");
        const dotForm = parseFhirPath("Observation.value.as(Quantity)");
        expect(parenForm.success).to.equal(true);
        expect(dotForm.success).to.equal(true);
        expect(validateAst(parenForm.ast).valid).to.equal(true);
        expect(validateAst(dotForm.ast).valid).to.equal(true);
    });

    it("parses exists choice paths", function () {
        const parsed = parseFhirPath("Patient.deceased.exists()");
        expect(parsed.success).to.equal(true);
        expect(validateAst(parsed.ast).valid).to.equal(true);
        expect(extractFieldPaths(parsed.ast)[0]).to.equal("Patient.deceasedBoolean");
    });

    it("rejects ofType", function () {
        const parsed = parseFhirPath("Observation.value.ofType(Quantity)");
        expect(parsed.success).to.equal(true);
        const validation = validateAst(parsed.ast);
        expect(validation.valid).to.equal(false);
        expect(validation.errors.some((entry) => entry.includes("ofType"))).to.equal(true);
    });

    it("rejects literal where comparison", function () {
        const parsed = parseFhirPath("Patient.name.where(given = 'foo')");
        expect(parsed.success).to.equal(true);
        const validation = validateAst(parsed.ast);
        expect(validation.valid).to.equal(false);
        expect(validation.errors.some((entry) => entry.includes("system"))).to.equal(true);
    });

    it("rejects unsafe standalone resolve", function () {
        const parsed = parseFhirPath("resolve()");
        expect(parsed.success).to.equal(false);
    });

    it("compiles resolve guard into referenceTargetType metadata", function () {
        const definition = buildDefinition({
            resource: {
                code: "patient-subject",
                base: ["Account"],
                type: "reference",
                expression: "Account.subject.where(resolve() is Patient)"
            }
        });
        definition.lookupKeys = ["Account::patient-subject"];
        const compiled = compileDefinition(definition);
        const lookup = compiled.lookupPlans["Account::patient-subject"];
        expect(lookup.compilable).to.equal(true);
        expect(lookup.plan.extractionPaths).to.deep.equal([
            {
                path: "subject",
                datatype: "Reference",
                referenceTargetType: "Patient"
            }
        ]);
    });

    it("parses deceased exists and not-false predicate", function () {
        const parsed = parseFhirPath("Patient.deceased.exists() and Patient.deceased != false");
        expect(parsed.success).to.equal(true);
        expect(validateAst(parsed.ast).valid).to.equal(true);
    });

    it("parses ContactPoint system where predicate", function () {
        const parsed = parseFhirPath("Patient.telecom.where(system='email')");
        expect(parsed.success).to.equal(true);
        expect(validateAst(parsed.ast).valid).to.equal(true);
    });

    it("rejects versioned and contained reference query values", function () {
        expect(validateReferenceQueryValue("Patient/123|2").valid).to.equal(false);
        expect(validateReferenceQueryValue("#contained-1").valid).to.equal(false);
    });

    it("normalizes bare id with expected target type", function () {
        const normalized = normalizeReferenceQueryValue("123", "Patient");
        expect(normalized.valid).to.equal(true);
        expect(normalized.normalizedValue).to.equal("Patient/123");
    });
});
