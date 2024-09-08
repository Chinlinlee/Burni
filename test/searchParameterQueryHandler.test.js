const { expect } = require("chai");
const { getUriQuery } = require("@root/models/FHIR/searchParameterQueryHandler");

describe("test search parameter query handler", () => {
    describe("uri query", () => {
        it("normal", () => {
            let query = {
                $and: [],
                "url": "http://acme.org/fhir/ValueSet/123"
            };
            getUriQuery(query, { url: ["url"] }, "url");

            expect(query).have.property("$and").have.property(0).have.property("$or");
            expect(query["$and"][0]["$or"]).have.property(0).have.property("url");
            expect(query["$and"][0]["$or"][0]["url"]).to.be.equal("http://acme.org/fhir/ValueSet/123");
        });

        it("modifier below", () => {
            let query = {
                $and: [],
                "url:below": "http://acme.org/fhir/"
            };
            getUriQuery(query, { "url:below": ["url"] }, "url:below");

            expect(query).have.property("$and").have.property(0).have.property("$or");
            expect(query["$and"][0]["$or"]).have.property(0).have.property("url").have.property("$regex");
        });

        it("modifier below with multiple fields", () => {
            let query = {
                $and: [],
                "url:below": "http://acme.org/fhir/"
            };
            getUriQuery(query, { "url:below": ["url", "url2"] }, "url:below");

            expect(query).have.property("$and").have.property(0).have.property("$or");
            expect(query["$and"][0]["$or"]).have.property(0).have.property("url").have.property("$regex");
            expect(query["$and"][0]["$or"]).have.property(1).have.property("url2").have.property("$regex");
        });

        it("modifier above", () => {
            let query = {
                $and: [],
                "url:above": "http://acme.org/fhir/ValueSet/123/_history/5"
            };
            getUriQuery(query, { "url:above": ["url"] }, "url:above");

            expect(query).have.property("$and").have.property(0).have.property("$or");
            expect(query["$and"][0]["$or"]).have.property(0).have.property("url").have.property("$or").have.lengthOf(6);
            expect(query["$and"][0]["$or"][0]["url"]["$or"]).contain("http://acme.org");
            expect(query["$and"][0]["$or"][0]["url"]["$or"]).contain("http://acme.org/fhir");
            expect(query["$and"][0]["$or"][0]["url"]["$or"]).contain("http://acme.org/fhir/ValueSet");
            expect(query["$and"][0]["$or"][0]["url"]["$or"]).contain("http://acme.org/fhir/ValueSet/123");
            expect(query["$and"][0]["$or"][0]["url"]["$or"]).contain("http://acme.org/fhir/ValueSet/123/_history");
            expect(query["$and"][0]["$or"][0]["url"]["$or"]).contain("http://acme.org/fhir/ValueSet/123/_history/5");
        });
    });
});