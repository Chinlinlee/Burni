require("module-alias/register");

const { expect } = require("chai");
const { parseSearchParameterName } = require("@models/FHIR/searchParameter/runtime/parameterName");

describe("parseSearchParameterName hops and terminal", function () {
    it("parses multihop type filters and terminal modifier", function () {
        const parsed = parseSearchParameterName("subject:Patient.organization:Organization.name:exact");

        expect(parsed).to.deep.include({
            code: "subject",
            typeFilter: "Patient",
            chain: "organization:Organization.name:exact",
            modifier: undefined
        });
        expect(parsed.hops).to.deep.equal([
            { code: "subject", typeFilter: "Patient" },
            { code: "organization", typeFilter: "Organization" }
        ]);
        expect(parsed.terminal).to.deep.equal({ code: "name", modifier: "exact" });
        expect(parsed.hops[1].code).to.equal("organization");
        expect(parsed.hops[1].typeFilter).to.equal("Organization");
    });

    it("treats colon as modifier when there are no dots", function () {
        const parsed = parseSearchParameterName("name:exact");

        expect(parsed).to.deep.include({
            code: "name",
            modifier: "exact",
            chain: undefined,
            typeFilter: undefined
        });
        expect(parsed.hops).to.deep.equal([]);
        expect(parsed.terminal).to.deep.equal({ code: "name", modifier: "exact" });
    });

    it("does not leave intermediate type filters inside hop codes", function () {
        const parsed = parseSearchParameterName("subject:Patient.organization:Organization.name");

        expect(parsed.hops).to.deep.equal([
            { code: "subject", typeFilter: "Patient" },
            { code: "organization", typeFilter: "Organization" }
        ]);
        expect(parsed.hops.every((hop) => !hop.code.includes(":"))).to.equal(true);
        expect(parsed.terminal).to.deep.equal({ code: "name", modifier: undefined });
    });

    it("keeps one-hop head fields for existing callers", function () {
        expect(parseSearchParameterName("subject.name")).to.deep.equal({
            code: "subject",
            typeFilter: undefined,
            chain: "name",
            modifier: undefined,
            hops: [{ code: "subject", typeFilter: undefined }],
            terminal: { code: "name", modifier: undefined }
        });
        expect(parseSearchParameterName("subject:Patient.name")).to.deep.equal({
            code: "subject",
            typeFilter: "Patient",
            chain: "name",
            modifier: undefined,
            hops: [{ code: "subject", typeFilter: "Patient" }],
            terminal: { code: "name", modifier: undefined }
        });
    });
});
