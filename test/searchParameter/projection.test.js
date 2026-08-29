require("module-alias/register");

const { expect } = require("chai");
const { compileDefinition } = require("@models/FHIR/searchParameter/compiler/compiler");
const { toChoiceElementName } = require("@models/FHIR/searchParameter/compiler/extractionPathCompiler");
const { validateAst } = require("@models/FHIR/searchParameter/compiler/astValidator");
const { parseFhirPath } = require("@models/FHIR/searchParameter/compiler/parserAdapter");
const { createSearchQueryPlan } = require("@models/FHIR/searchParameter/compiler/searchQueryPlan");
const { executeSearchQueryPlan } = require("@models/FHIR/searchParameter/executor/mongoExecutor");
const {
    ADDRESS_STRING_FIELDS,
    HUMAN_NAME_STRING_FIELDS
} = require("@models/FHIR/searchParameter/executor/searchTypeProjection");

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
            multipleOr: true,
            multipleAnd: true,
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

describe("Search-type projection golden filters", function () {
    it("projects string search on Address leaf fields", function () {
        const plan = createSearchQueryPlan({
            canonicalKey: "test",
            resourceType: "Patient",
            code: "address",
            searchType: "string",
            extractionPaths: [{ path: "address", datatype: "Address" }]
        });
        const filter = executeSearchQueryPlan(plan, "PleasantVille", "address");
        expect(filter.$or).to.have.length(ADDRESS_STRING_FIELDS.length);
        for (const leaf of ADDRESS_STRING_FIELDS) {
            const branch = filter.$or.find((entry) => entry[`address.${leaf}`]);
            expect(branch).to.exist;
            expect(branch[`address.${leaf}`]).to.have.property("$regex");
        }
        expect(filter.$or.some((entry) => entry.address)).to.equal(false);
    });

    it("projects string search on HumanName leaf fields", function () {
        const plan = createSearchQueryPlan({
            canonicalKey: "test",
            resourceType: "Patient",
            code: "name",
            searchType: "string",
            extractionPaths: [{ path: "name", datatype: "HumanName" }]
        });
        const filter = executeSearchQueryPlan(plan, "Chalmers", "name");
        expect(filter.$or).to.have.length(HUMAN_NAME_STRING_FIELDS.length);
        for (const leaf of HUMAN_NAME_STRING_FIELDS) {
            expect(filter.$or.some((entry) => entry[`name.${leaf}`])).to.equal(true);
        }
    });

    it("projects token search on CodeableConcept coding fields", function () {
        const plan = createSearchQueryPlan({
            canonicalKey: "test",
            resourceType: "Observation",
            code: "code",
            searchType: "token",
            extractionPaths: [{ path: "code", datatype: "CodeableConcept" }]
        });
        const filter = executeSearchQueryPlan(plan, "http://loinc.org|1234-5", "code");
        expect(filter.$and).to.have.length(2);
        expect(filter.$and.some((entry) => entry["code.coding.system"])).to.equal(true);
        expect(filter.$and.some((entry) => entry["code.coding.code"])).to.equal(true);
        expect(filter).to.not.have.property("code.text");
    });

    it("projects reference search on .reference", function () {
        const plan = createSearchQueryPlan({
            canonicalKey: "test",
            resourceType: "Observation",
            code: "subject",
            searchType: "reference",
            extractionPaths: [{ path: "subject", datatype: "Reference" }]
        });
        const filter = executeSearchQueryPlan(plan, "Patient/example", "subject");
        expect(filter).to.deep.equal({ "subject.reference": "Patient/example" });
    });

    it("projects reference search with target guard and correlated array predicate", function () {
        const plan = createSearchQueryPlan({
            canonicalKey: "test",
            resourceType: "Account",
            code: "subject",
            searchType: "reference",
            extractionPaths: [
                { path: "subject", datatype: "Reference", referenceTargetType: "Patient" }
            ]
        });
        const filter = executeSearchQueryPlan(plan, "123", "subject");
        expect(filter.$or).to.have.length(2);
        expect(JSON.stringify(filter)).to.include("Patient/123");
        expect(JSON.stringify(filter)).to.include("$elemMatch");
    });

    it("supports dot-as choice syntax", function () {
        const parsed = parseFhirPath("Observation.value.as(Quantity)");
        expect(parsed.success).to.equal(true);
        expect(validateAst(parsed.ast).valid).to.equal(true);

        const definition = buildDefinition({
            resource: {
                code: "value-quantity",
                base: ["Observation"],
                type: "quantity",
                expression: "Observation.value.as(Quantity)"
            }
        });
        definition.lookupKeys = ["Observation::value-quantity"];
        const compiled = compileDefinition(definition);
        expect(compiled.lookupPlans["Observation::value-quantity"].plan.extractionPaths).to.deep.equal([
            { path: "valueQuantity", datatype: "Quantity" }
        ]);
    });

    it("uses Choice element casing for as/ofType paths", function () {
        expect(toChoiceElementName("deceased", "dateTime")).to.equal("deceasedDateTime");
        expect(toChoiceElementName("value", "Quantity")).to.equal("valueQuantity");

        const definition = buildDefinition({
            resource: {
                code: "deceased-date",
                base: ["Patient"],
                type: "date",
                expression: "(Patient.deceased as dateTime)"
            }
        });
        definition.lookupKeys = ["Patient::deceased-date"];
        const compiled = compileDefinition(definition);
        const plan = compiled.lookupPlans["Patient::deceased-date"].plan;
        expect(plan.extractionPaths).to.deep.equal([
            { path: "deceasedDateTime", datatype: "dateTime" }
        ]);
    });

    it("$ors every compatible union branch", function () {
        const definition = buildDefinition({
            resource: {
                code: "combo-code",
                base: ["Observation"],
                type: "token",
                expression: "Observation.code | Observation.component.code"
            }
        });
        definition.lookupKeys = ["Observation::combo-code"];
        const compiled = compileDefinition(definition);
        const plan = compiled.lookupPlans["Observation::combo-code"].plan;
        expect(plan.extractionPaths).to.deep.equal([
            { path: "code", datatype: "CodeableConcept" },
            { path: "component.code", datatype: "CodeableConcept" }
        ]);

        const filter = executeSearchQueryPlan(plan, "http://loinc.org|1234-5", "combo-code");
        expect(filter.$or).to.have.length(2);
    });

    it("omits SampledData from quantity search with diagnostics", function () {
        const definition = buildDefinition({
            resource: {
                code: "value-quantity",
                base: ["Observation"],
                type: "quantity",
                expression: "(Observation.value as Quantity) | (Observation.value as SampledData)"
            }
        });
        definition.lookupKeys = ["Observation::value-quantity"];
        const compiled = compileDefinition(definition);
        const lookup = compiled.lookupPlans["Observation::value-quantity"];
        expect(lookup.compilable).to.equal(true);
        expect(lookup.plan.extractionPaths).to.deep.equal([
            { path: "valueQuantity", datatype: "Quantity" }
        ]);
        expect(
            compiled.diagnostics.some((entry) => entry.code === "incompatible-branch")
        ).to.equal(true);
    });

    it("omits paths missing from the Resource type map", function () {
        const definition = buildDefinition({
            resource: {
                code: "missing-path",
                base: ["Patient"],
                type: "string",
                expression: "Patient.notARealField"
            }
        });
        definition.lookupKeys = ["Patient::missing-path"];
        const compiled = compileDefinition(definition);
        const lookup = compiled.lookupPlans["Patient::missing-path"];
        expect(lookup.compilable).to.equal(false);
        expect(
            compiled.diagnostics.some((entry) =>
                entry.message.includes("missing from Patient type map")
            )
        ).to.equal(true);
    });

    it("projects address leaf paths without Address.text", function () {
        const definition = buildDefinition({
            resource: {
                code: "address-city",
                base: ["Patient"],
                type: "string",
                expression: "Patient.address.city"
            }
        });
        definition.lookupKeys = ["Patient::address-city"];
        const compiled = compileDefinition(definition);
        const plan = compiled.lookupPlans["Patient::address-city"].plan;
        expect(plan.extractionPaths).to.deep.equal([
            { path: "address.city", datatype: "string" }
        ]);
        const filter = executeSearchQueryPlan(plan, "Amsterdam", "address-city");
        expect(filter).to.have.property("address.city");
        expect(JSON.stringify(filter)).to.not.include("address.text");
    });

    it("projects email with correlated ContactPoint system predicate", function () {
        const definition = buildDefinition({
            resource: {
                code: "email",
                base: ["Patient"],
                type: "token",
                expression: "Patient.telecom.where(system='email')"
            }
        });
        definition.lookupKeys = ["Patient::email"];
        const compiled = compileDefinition(definition);
        const plan = compiled.lookupPlans["Patient::email"].plan;
        const filter = executeSearchQueryPlan(plan, "user@example.org", "email");
        expect(filter.telecom.$elemMatch.system).to.equal("email");
        expect(filter.telecom.$elemMatch.value).to.equal("user@example.org");
    });

    it("projects deceased across choice branches", function () {
        const definition = buildDefinition({
            resource: {
                code: "deceased",
                base: ["Patient"],
                type: "token",
                expression: "Patient.deceased.exists() and Patient.deceased != false"
            }
        });
        definition.lookupKeys = ["Patient::deceased"];
        const compiled = compileDefinition(definition);
        const plan = compiled.lookupPlans["Patient::deceased"].plan;
        expect(plan.extractionPaths).to.have.length(2);
        const filter = executeSearchQueryPlan(plan, "true", "deceased");
        expect(filter.$or).to.have.length(2);
    });

    it("does not replicate quantity eq10 as $eq: null", function () {
        const plan = createSearchQueryPlan({
            canonicalKey: "test",
            resourceType: "Observation",
            code: "value-quantity",
            searchType: "quantity",
            extractionPaths: [{ path: "valueQuantity", datatype: "Quantity" }]
        });
        const filter = executeSearchQueryPlan(plan, "eq10|kg", "value-quantity");
        const serialized = JSON.stringify(filter);
        expect(serialized).to.not.include('"null"');
        expect(serialized).to.include('"valueQuantity.value"');
        expect(serialized).to.include('"$eq":10');
    });
});

describe("Per-lookup SearchQueryPlan compilation", function () {
    it("keeps only the lookup resource union branch", function () {
        const definition = buildDefinition({
            resource: {
                code: "address",
                base: ["Patient", "Person"],
                type: "string",
                expression: "Patient.address | Person.address"
            }
        });
        definition.lookupKeys = ["Patient::address", "Person::address"];
        const compiled = compileDefinition(definition);
        expect(compiled.lookupPlans["Patient::address"].plan.extractionPaths).to.deep.equal([
            { path: "address", datatype: "Address" }
        ]);
        expect(compiled.lookupPlans["Person::address"].plan.extractionPaths).to.deep.equal([
            { path: "address", datatype: "Address" }
        ]);
        expect(
            compiled.lookupPlans["Patient::address"].plan.extractionPaths.some((entry) =>
                entry.path.startsWith("Person")
            )
        ).to.equal(false);
    });
});
