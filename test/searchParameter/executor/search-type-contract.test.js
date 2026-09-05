require("module-alias/register");

const { expect } = require("chai");
const { createSearchQueryPlan } = require("@models/FHIR/searchParameter/compiler/searchQueryPlan");
const { executeSearchQueryPlan } = require("@models/FHIR/searchParameter/executor/mongoExecutor");
const { validateAndBuildFilter } = require("@models/FHIR/searchParameter/executor/queryValueParser");

function plan(fields) {
    return createSearchQueryPlan({
        canonicalKey: "test",
        resourceType: "Observation",
        code: fields.code || "test",
        ...fields
    });
}

describe("Search type operator contracts", function () {
    describe("string", function () {
        const stringPlan = () =>
            plan({
                searchType: "string",
                code: "name",
                extractionPaths: [{ path: "name.family", datatype: "string" }],
                modifiers: ["contains", "exact"]
            });

        it("matches the default prefix search", function () {
            const filter = executeSearchQueryPlan(stringPlan(), "Chalmers", "name");
            expect(filter["name.family"].$regex).to.be.instanceOf(RegExp);
        });

        it("applies :contains and :exact", function () {
            const contains = executeSearchQueryPlan(stringPlan(), "alm", "name:contains");
            const exact = executeSearchQueryPlan(stringPlan(), "Chalmers", "name:exact");
            expect(contains["name.family"].$regex.source).to.not.include("^");
            expect(exact["name.family"]).to.equal("Chalmers");
        });

        it("ORs comma-separated values and ANDs repeated values", function () {
            const orFilter = executeSearchQueryPlan(stringPlan(), "Chalmers,Jones", "name");
            const andFilter = executeSearchQueryPlan(stringPlan(), ["Chalmers", "Jones"], "name");
            expect(orFilter.$or).to.have.length(2);
            expect(andFilter.$and).to.have.length(2);
        });

        it("distinguishes missing true from missing false", function () {
            const missing = executeSearchQueryPlan(stringPlan(), "true", "name:missing");
            const present = executeSearchQueryPlan(stringPlan(), "false", "name:missing");
            expect(missing).to.have.property("$nor");
            expect(present).to.have.property("$or");
        });

        it("rejects an undeclared modifier", function () {
            const result = validateAndBuildFilter(stringPlan(), "Chalmers", "name:not");
            expect(result.valid).to.equal(false);
            expect(result.reason).to.include("Modifier");
        });
    });

    describe("token", function () {
        const tokenPlan = () =>
            plan({
                searchType: "token",
                code: "code",
                extractionPaths: [{ path: "code", datatype: "CodeableConcept" }],
                modifiers: ["text"]
            });

        it("matches system and code", function () {
            const filter = executeSearchQueryPlan(
                tokenPlan(),
                "http://loinc.org|1234-5",
                "code"
            );
            expect(filter.$and).to.have.length(2);
        });

        it("applies :text to CodeableConcept.text", function () {
            const filter = executeSearchQueryPlan(tokenPlan(), "glucose", "code:text");
            expect(filter).to.deep.equal({ "code.text": "glucose" });
        });

        it("rejects unimplemented token modifiers", function () {
            const result = validateAndBuildFilter(tokenPlan(), "1234-5", "code:not");
            expect(result.valid).to.equal(false);
        });
    });

    describe("number", function () {
        const numberPlan = () =>
            plan({
                searchType: "number",
                code: "probability",
                extractionPaths: [{ path: "probabilityDecimal", datatype: "decimal" }],
                comparators: ["eq", "gt", "lt"]
            });

        it("applies declared comparators", function () {
            const eq = executeSearchQueryPlan(numberPlan(), "10", "probability");
            const gt = executeSearchQueryPlan(numberPlan(), "gt10", "probability");
            expect(JSON.stringify(eq)).to.include("10");
            expect(JSON.stringify(gt)).to.include("$gt");
        });

        it("rejects an undeclared comparator", function () {
            const result = validateAndBuildFilter(numberPlan(), "sa10", "probability");
            expect(result.valid).to.equal(false);
        });
    });

    describe("date", function () {
        const datePlan = () =>
            plan({
                searchType: "date",
                code: "date",
                extractionPaths: [{ path: "effectiveDateTime", datatype: "dateTime" }],
                comparators: ["eq", "gt", "lt", "ge", "le"]
            });

        it("applies a greater-than comparator", function () {
            const filter = executeSearchQueryPlan(datePlan(), "gt2010-01-01", "date");
            expect(JSON.stringify(filter)).to.include("$gt");
        });

        it("supports :missing", function () {
            const filter = executeSearchQueryPlan(datePlan(), "true", "date:missing");
            expect(filter).to.have.property("$nor");
        });
    });

    describe("quantity", function () {
        const quantityPlan = () =>
            plan({
                searchType: "quantity",
                code: "value-quantity",
                extractionPaths: [{ path: "valueQuantity", datatype: "Quantity" }],
                comparators: ["eq", "gt"]
            });

        it("projects value with a comparator", function () {
            const filter = executeSearchQueryPlan(quantityPlan(), "gt10|kg", "value-quantity");
            expect(JSON.stringify(filter)).to.include("valueQuantity.value");
        });
    });

    describe("uri", function () {
        const uriPlan = (extractionPaths = [{ path: "url", datatype: "uri" }]) =>
            plan({
                searchType: "uri",
                code: "url",
                extractionPaths,
                modifiers: ["below", "above"]
            });

        it("matches an exact uri value", function () {
            const filter = executeSearchQueryPlan(
                uriPlan(),
                "http://acme.org/fhir/ValueSet/123",
                "url"
            );
            expect(filter).to.deep.equal({ url: "http://acme.org/fhir/ValueSet/123" });
        });

        it("applies :below as a path-boundary prefix match", function () {
            const filter = executeSearchQueryPlan(
                uriPlan(),
                "http://example.org/fhir",
                "url:below"
            );
            expect(filter.url.$regex).to.be.instanceOf(RegExp);
            expect(filter.url.$regex.flags).to.not.include("i");
            expect(filter.url.$regex.test("http://example.org/fhir/123")).to.be.true;
            expect(filter.url.$regex.test("http://example.org/fhirx")).to.be.false;
        });

        it("ORs :below across multiple extraction paths", function () {
            const filter = executeSearchQueryPlan(
                uriPlan([
                    { path: "url", datatype: "uri" },
                    { path: "url2", datatype: "uri" }
                ]),
                "http://acme.org/fhir/",
                "url:below"
            );

            expect(filter).to.have.property("$or").with.lengthOf(2);
            expect(filter.$or[0]).to.have.nested.property("url.$regex");
            expect(filter.$or[1]).to.have.nested.property("url2.$regex");
        });

        it("applies :above as the uri prefix hierarchy with $in", function () {
            const filter = executeSearchQueryPlan(
                uriPlan(),
                "http://acme.org/fhir/ValueSet/123/_history/5",
                "url:above"
            );

            expect(filter.url).to.deep.equal({
                $in: [
                    "http://acme.org",
                    "http://acme.org/fhir",
                    "http://acme.org/fhir/ValueSet",
                    "http://acme.org/fhir/ValueSet/123",
                    "http://acme.org/fhir/ValueSet/123/_history",
                    "http://acme.org/fhir/ValueSet/123/_history/5"
                ]
            });
        });

        it("rejects invalid uri search values", function () {
            const empty = validateAndBuildFilter(uriPlan(), "", "url");
            const urnBelow = validateAndBuildFilter(uriPlan(), "urn:oid:1.2.3", "url:below");
            const relativeAbove = validateAndBuildFilter(uriPlan(), "Patient/example", "url:above");

            expect(empty.valid).to.equal(false);
            expect(empty.reason).to.include("Invalid uri search value");
            expect(urnBelow.valid).to.equal(false);
            expect(relativeAbove.valid).to.equal(false);
        });

        it("rejects an undeclared string modifier", function () {
            const result = validateAndBuildFilter(uriPlan(), "http://example.org", "url:contains");
            expect(result.valid).to.equal(false);
        });
    });

    describe("reference", function () {
        const referencePlan = () =>
            plan({
                searchType: "reference",
                code: "subject",
                extractionPaths: [{ path: "subject", datatype: "Reference" }]
            });

        it("matches a resource reference", function () {
            const filter = executeSearchQueryPlan(referencePlan(), "Patient/example", "subject");
            expect(filter).to.deep.equal({ "subject.reference": "Patient/example" });
        });

        it("rejects unimplemented :identifier", function () {
            const result = validateAndBuildFilter(
                referencePlan(),
                "http://example.org|123",
                "subject:identifier"
            );
            expect(result.valid).to.equal(false);
        });
    });

    describe("multiplicity flags", function () {
        it("rejects comma values when multipleOr is false", function () {
            const result = validateAndBuildFilter(
                plan({
                    searchType: "string",
                    multipleOr: false,
                    extractionPaths: [{ path: "name", datatype: "string" }]
                }),
                "A,B",
                "name"
            );
            expect(result.valid).to.equal(false);
            expect(result.reason).to.include("multipleOr");
        });

        it("rejects repeated values when multipleAnd is false", function () {
            const result = validateAndBuildFilter(
                plan({
                    searchType: "string",
                    multipleAnd: false,
                    extractionPaths: [{ path: "name", datatype: "string" }]
                }),
                ["A", "B"],
                "name"
            );
            expect(result.valid).to.equal(false);
            expect(result.reason).to.include("multipleAnd");
        });
    });
});
