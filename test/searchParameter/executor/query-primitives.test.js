require("module-alias/register");

const { expect } = require("chai");
const { uriQuery } = require("@models/FHIR/searchParameter/executor/queryPrimitives");

describe("query primitives", function () {
    describe("uriQuery", function () {
        it("matches an exact uri value", function () {
            const result = uriQuery("http://acme.org/fhir/ValueSet/123", "url");

            expect(result).to.equal("http://acme.org/fhir/ValueSet/123");
        });

        it("applies :below as a case-insensitive prefix regex", function () {
            const result = uriQuery("http://acme.org/fhir", "url:below");

            expect(result).to.have.property("$regex");
            expect(result.$regex.test("http://acme.org/fhir")).to.be.true;
            expect(result.$regex.test("http://acme.org/fhir/123")).to.be.true;
            expect(result.$regex.test("http://acme.org/")).to.be.false;
        });

        it("applies :above as the uri prefix hierarchy", function () {
            const result = uriQuery(
                "http://acme.org/fhir/ValueSet/123/_history/5",
                "url:above"
            );

            expect(result).to.be.an("array");
            expect(result).to.include("http://acme.org/fhir/ValueSet/123/_history/5");
            expect(result).to.include("http://acme.org/fhir/ValueSet/123/_history");
            expect(result).to.include("http://acme.org/fhir/ValueSet/123");
            expect(result).to.include("http://acme.org/fhir/ValueSet");
            expect(result).to.include("http://acme.org/fhir");
            expect(result).to.include("http://acme.org");
        });
    });
});
