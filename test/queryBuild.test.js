const { expect } = require("chai");

const { uriQuery } = require("@root/models/FHIR/queryBuild");

describe("test query build", () => {
    describe("test uri query build", () => {
        it("normal", () => {
            let result = uriQuery("http://acme.org/fhir/ValueSet/123", "url");

            expect(result).to.equal("http://acme.org/fhir/ValueSet/123");
        });

        it("modifier :below", () => {
            let result = uriQuery("http://acme.org/fhir", "url:below");

            expect(result).has.property("$regex");

            expect(result.$regex.test("http://acme.org/fhir")).to.be.true;
            expect(result.$regex.test("http://acme.org/fhir/123")).to.be.true;
            expect(result.$regex.test("http://acme.org/")).to.be.false;
        });

        it("modifier :above", () => {
            let result = uriQuery("http://acme.org/fhir/ValueSet/123/_history/5", "url:above");

            expect(result).to.be.an("array");

            expect(result).contains("http://acme.org/fhir/ValueSet/123/_history/5");
            expect(result).contains("http://acme.org/fhir/ValueSet/123/_history");
            expect(result).contains("http://acme.org/fhir/ValueSet/123");
            expect(result).contains("http://acme.org/fhir/ValueSet");
            expect(result).contains("http://acme.org/fhir");
            expect(result).contains("http://acme.org");
        });
    });
});