require("module-alias/register");

const { expect } = require("chai");
const { uriQuery } = require("@models/FHIR/searchParameter/executor/queryPrimitives");

describe("query primitives", function () {
    describe("uriQuery", function () {
        it("matches an exact uri value", function () {
            const result = uriQuery("http://acme.org/fhir/ValueSet/123");

            expect(result).to.equal("http://acme.org/fhir/ValueSet/123");
        });

        it("applies :below as a case-sensitive path-boundary regex", function () {
            const result = uriQuery("http://acme.org/fhir", "below");

            expect(result).to.have.property("$regex");
            expect(result.$regex.flags).to.not.include("i");
            expect(result.$regex.test("http://acme.org/fhir")).to.be.true;
            expect(result.$regex.test("http://acme.org/fhir/123")).to.be.true;
            expect(result.$regex.test("http://acme.org/fhirx")).to.be.false;
            expect(result.$regex.test("http://acme.org/")).to.be.false;
        });

        it("applies :above as a MongoDB $in hierarchy", function () {
            const result = uriQuery(
                "http://acme.org/fhir/ValueSet/123/_history/5",
                "above"
            );

            expect(result).to.deep.equal({
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

        it("throws Invalid uri search value instead of URL parser errors", function () {
            expect(() => uriQuery("urn:oid:1.2.3", "below")).to.throw(
                "Invalid uri search value"
            );
            expect(() => uriQuery("", undefined)).to.throw("Invalid uri search value");
        });
    });
});
