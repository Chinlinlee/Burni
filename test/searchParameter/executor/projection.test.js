require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const { compileDefinition } = require("@models/FHIR/searchParameter/compiler/compiler");
const { toChoiceElementName } = require("@models/FHIR/searchParameter/compiler/extractionPathCompiler");
const { validateAst } = require("@models/FHIR/searchParameter/compiler/astValidator");
const { parseFhirPath } = require("@models/FHIR/searchParameter/compiler/parserAdapter");
const { createSearchQueryPlan } = require("@models/FHIR/searchParameter/compiler/searchQueryPlan");
const { executeSearchQueryPlan } = require("@models/FHIR/searchParameter/executor/mongoExecutor");
const {
    ADDRESS_STRING_FIELDS,
    HUMAN_NAME_STRING_FIELDS,
    buildProjectedFilter
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
    it("projects temporal datatypes to their canonical searchable leaves", function () {
        const cases = [
            {
                datatype: "date",
                expectedFields: ["effective.normalizedStart", "effective.normalizedEnd"],
                expectedTypes: ["string", "string"]
            },
            {
                datatype: "dateTime",
                expectedFields: ["effective.normalizedStart", "effective.normalizedEnd"],
                expectedTypes: ["Decimal128", "Decimal128"]
            },
            {
                datatype: "instant",
                expectedFields: ["effective.epochSeconds"],
                expectedTypes: ["Decimal128"]
            }
        ];

        for (const testCase of cases) {
            const plan = createSearchQueryPlan({
                canonicalKey: "test",
                resourceType: "Observation",
                code: "effective",
                searchType: "date",
                extractionPaths: [{ path: "effective", datatype: testCase.datatype }]
            });
            const filter = executeSearchQueryPlan(plan, "2020-02-07", "effective");
            const fields = Object.keys(filter).filter((key) => !key.startsWith("$"));

            expect(fields).to.have.members(testCase.expectedFields);
            expect(fields).to.have.length(testCase.expectedFields.length);
            for (const [index, field] of testCase.expectedFields.entries()) {
                const operator = filter[field];
                const value = Object.values(operator)[0];
                const actualType =
                    value instanceof mongoose.Types.Decimal128 ? "Decimal128" : typeof value;
                expect(actualType).to.equal(testCase.expectedTypes[index]);
            }
        }
    });

    it("keeps nested and choice temporal extraction paths typed", function () {
        const nestedDefinition = buildDefinition({
            resource: {
                code: "component-date",
                base: ["Observation"],
                type: "date",
                expression: "Observation.component.valueDateTime"
            }
        });
        nestedDefinition.lookupKeys = ["Observation::component-date"];
        const nestedPlan =
            compileDefinition(nestedDefinition).lookupPlans["Observation::component-date"].plan;
        expect(nestedPlan.extractionPaths).to.deep.equal([
            {
                path: "component.valueDateTime",
                datatype: "dateTime",
                arrayPaths: ["component"]
            }
        ]);

        const nestedFilter = executeSearchQueryPlan(
            nestedPlan,
            "2020-02-07",
            "component-date"
        );
        const nestedElementFilter = nestedFilter.component.$elemMatch;
        expect(nestedElementFilter).to.have.property("valueDateTime.normalizedStart");
        expect(nestedElementFilter).to.have.property("valueDateTime.normalizedEnd");

        const choiceDefinition = buildDefinition({
            resource: {
                code: "effective-date",
                base: ["Observation"],
                type: "date",
                expression: "Observation.effective.as(dateTime)"
            }
        });
        choiceDefinition.lookupKeys = ["Observation::effective-date"];
        const choicePlan =
            compileDefinition(choiceDefinition).lookupPlans["Observation::effective-date"].plan;
        expect(choicePlan.extractionPaths).to.deep.equal([
            { path: "effectiveDateTime", datatype: "dateTime" }
        ]);
        const choiceFilter = executeSearchQueryPlan(
            choicePlan,
            "2020-02-07",
            "effective-date"
        );
        expect(choiceFilter).to.have.property("effectiveDateTime.normalizedStart");
        expect(choiceFilter).to.have.property("effectiveDateTime.normalizedEnd");
    });

    it("resolves nested Timing paths and all temporal choice branches", function () {
        const timingDefinition = buildDefinition({
            resource: {
                code: "activity-date",
                base: ["CarePlan"],
                type: "date",
                expression: "CarePlan.activity.detail.scheduled"
            }
        });
        timingDefinition.lookupKeys = ["CarePlan::activity-date"];
        const timingPlan =
            compileDefinition(timingDefinition).lookupPlans["CarePlan::activity-date"].plan;

        expect(timingPlan.extractionPaths).to.deep.include({
            path: "activity.detail.scheduledTiming.event",
            datatype: "dateTime",
            arrayPaths: ["activity", "activity.detail.scheduledTiming.event"]
        });
        expect(timingPlan.extractionPaths).to.deep.include({
            path: "activity.detail.scheduledPeriod",
            datatype: "Period",
            arrayPaths: ["activity"]
        });

        const nestedDefinition = buildDefinition({
            resource: {
                code: "medication-date",
                base: ["MedicationRequest"],
                type: "date",
                expression: "MedicationRequest.dosageInstruction.timing.event"
            }
        });
        nestedDefinition.lookupKeys = ["MedicationRequest::medication-date"];
        const nestedPlan =
            compileDefinition(nestedDefinition).lookupPlans["MedicationRequest::medication-date"].plan;
        expect(nestedPlan.extractionPaths).to.deep.equal([
            {
                path: "dosageInstruction.timing.event",
                datatype: "dateTime",
                arrayPaths: ["dosageInstruction", "dosageInstruction.timing.event"]
            }
        ]);

        const instantDefinition = buildDefinition({
            resource: {
                code: "effective-instant",
                base: ["Observation"],
                type: "date",
                expression: "Observation.effective.as(instant)"
            }
        });
        instantDefinition.lookupKeys = ["Observation::effective-instant"];
        const instantPlan =
            compileDefinition(instantDefinition).lookupPlans["Observation::effective-instant"].plan;
        expect(instantPlan.extractionPaths).to.deep.equal([
            { path: "effectiveInstant", datatype: "instant" }
        ]);
        const instantFilter = executeSearchQueryPlan(
            instantPlan,
            "2020-02-07",
            "effective-instant"
        );
        expect(instantFilter).to.have.property("effectiveInstant.epochSeconds");
    });

    it("does not project raw or incompatible temporal values", function () {
        const plan = createSearchQueryPlan({
            canonicalKey: "test",
            resourceType: "Observation",
            code: "effective",
            searchType: "date",
            extractionPaths: [{ path: "effective", datatype: "dateTime" }]
        });
        const filter = executeSearchQueryPlan(plan, "2020-02-07", "effective");

        expect(filter).to.not.have.property("effective");
        expect(filter).to.not.have.property("effective.value");
        expect(JSON.stringify(filter)).to.not.include("effective.value");
        expect(() =>
            buildProjectedFilter("date", "2020-02-07", "effective", "string")
        ).to.throw(/No search-type projection/);
    });

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
        const patientPlan = compiled.lookupPlans["Patient::address"].plan;
        const personPlan = compiled.lookupPlans["Person::address"].plan;

        expect(patientPlan).to.not.equal(personPlan);
        expect(patientPlan.resourceType).to.equal("Patient");
        expect(personPlan.resourceType).to.equal("Person");
        expect(patientPlan.extractionPaths).to.deep.equal([
            { path: "address", datatype: "Address" }
        ]);
        expect(personPlan.extractionPaths).to.deep.equal([
            { path: "address", datatype: "Address" }
        ]);
        expect(
            patientPlan.extractionPaths.some((entry) => entry.path.startsWith("Person"))
        ).to.equal(false);
    });

    it("types the same field name from each resource type map", function () {
        const patientName = buildDefinition({
            resource: {
                code: "name",
                base: ["Patient"],
                type: "string",
                expression: "Patient.name"
            }
        });
        patientName.lookupKeys = ["Patient::name"];

        const locationName = buildDefinition({
            resource: {
                url: "http://example.org/SearchParameter/location-name",
                code: "name",
                base: ["Location"],
                type: "string",
                expression: "Location.name | Location.alias"
            }
        });
        locationName.canonicalKey = "http://example.org/SearchParameter/location-name::4.0.1";
        locationName.lookupKeys = ["Location::name"];

        const patientCompiled = compileDefinition(patientName);
        const locationCompiled = compileDefinition(locationName);

        expect(patientCompiled.lookupPlans["Patient::name"].plan.extractionPaths).to.deep.equal([
            { path: "name", datatype: "HumanName" }
        ]);
        expect(locationCompiled.lookupPlans["Location::name"].plan.extractionPaths).to.deep.equal([
            { path: "name", datatype: "string" },
            { path: "alias", datatype: "string" }
        ]);
    });

    it("does not attach another base's plan when one union branch cannot compile", function () {
        const definition = buildDefinition({
            resource: {
                code: "address",
                base: ["Patient", "Person"],
                type: "string",
                expression: "Patient.address | Person.notARealField"
            }
        });
        definition.lookupKeys = ["Patient::address", "Person::address"];
        const compiled = compileDefinition(definition);

        expect(compiled.lookupPlans["Patient::address"].compilable).to.equal(true);
        expect(compiled.lookupPlans["Person::address"].compilable).to.equal(false);
        expect(compiled.lookupPlans["Person::address"].plan).to.equal(undefined);
    });

    it("disables a lookup whose union branches all belong to another resource", function () {
        const definition = buildDefinition({
            resource: {
                code: "address",
                base: ["Patient"],
                type: "string",
                expression: "Person.address | RelatedPerson.address"
            }
        });
        definition.lookupKeys = ["Patient::address"];
        const compiled = compileDefinition(definition);
        const lookup = compiled.lookupPlans["Patient::address"];
        expect(lookup.compilable).to.equal(false);
        expect(lookup.plan).to.equal(undefined);
    });

    it("omits BackboneElement paths that have no search-type projection", function () {
        const definition = buildDefinition({
            resource: {
                code: "contact",
                base: ["Patient"],
                type: "string",
                expression: "Patient.contact"
            }
        });
        definition.lookupKeys = ["Patient::contact"];
        const compiled = compileDefinition(definition);
        const lookup = compiled.lookupPlans["Patient::contact"];
        expect(lookup.compilable).to.equal(false);
        expect(
            compiled.diagnostics.some((entry) =>
                entry.message.includes("No search-type projection")
            )
        ).to.equal(true);
    });

    it("compiles nested complex-type leaf paths with the leaf datatype", function () {
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
        expect(compiled.lookupPlans["Patient::address-city"].plan.extractionPaths).to.deep.equal([
            { path: "address.city", datatype: "string" }
        ]);
    });

    it("compiles both as-syntax forms in one union", function () {
        const definition = buildDefinition({
            resource: {
                code: "value-quantity",
                base: ["Observation"],
                type: "quantity",
                expression:
                    "(Observation.value as Quantity) | Observation.value.as(Quantity)"
            }
        });
        definition.lookupKeys = ["Observation::value-quantity"];
        const compiled = compileDefinition(definition);
        expect(
            compiled.lookupPlans["Observation::value-quantity"].plan.extractionPaths
        ).to.deep.equal([{ path: "valueQuantity", datatype: "Quantity" }]);
    });
});
