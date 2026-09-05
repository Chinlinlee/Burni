require("module-alias/register");

const { expect } = require("chai");
const {
    validateUriQueryValue,
    isValidUriSyntax,
    isHierarchicalAbsoluteUri,
    buildUriHierarchyPrefixes,
    buildUriBelowMatcher,
    getUriHierarchyBase
} = require("@models/FHIR/searchParameter/executor/uriValueParser");

describe("uri value parser", function () {
    describe("isValidUriSyntax", function () {
        it("accepts absolute http and custom scheme URIs", function () {
            expect(isValidUriSyntax("http://acme.org/fhir/ValueSet/123")).to.be.true;
            expect(isValidUriSyntax("custom+scheme://host/path")).to.be.true;
        });

        it("accepts relative references and URNs", function () {
            expect(isValidUriSyntax("Patient/example")).to.be.true;
            expect(isValidUriSyntax("/fhir/Patient/example")).to.be.true;
            expect(isValidUriSyntax("urn:oid:1.2.3")).to.be.true;
        });

        it("rejects empty and syntactically invalid values", function () {
            expect(isValidUriSyntax("")).to.be.false;
            expect(isValidUriSyntax("http://exam ple.org")).to.be.false;
            expect(isValidUriSyntax("http://example.org/%ZZ")).to.be.false;
        });
    });

    describe("validateUriQueryValue", function () {
        it("accepts exact search values without hierarchical constraints", function () {
            expect(validateUriQueryValue("urn:oid:1.2.3", undefined).valid).to.be.true;
            expect(validateUriQueryValue("Patient/example", undefined).valid).to.be.true;
        });

        it("rejects empty and invalid exact values", function () {
            expect(validateUriQueryValue("", undefined).valid).to.be.false;
            expect(validateUriQueryValue("not a uri", undefined).valid).to.be.false;
        });

        it("requires hierarchical absolute URLs for :above and :below", function () {
            expect(validateUriQueryValue("http://acme.org/fhir", "below").valid).to.be.true;
            expect(validateUriQueryValue("urn:oid:1.2.3", "below").valid).to.be.false;
            expect(validateUriQueryValue("Patient/example", "above").valid).to.be.false;
            expect(validateUriQueryValue("mailto:test@example.org", "above").valid).to.be.false;
        });
    });

    describe("buildUriHierarchyPrefixes", function () {
        it("builds path ancestors without query or fragment", function () {
            const prefixes = buildUriHierarchyPrefixes(
                "http://acme.org/fhir/ValueSet/123/_history/5?q=1#frag"
            );

            expect(prefixes).to.deep.equal([
                "http://acme.org",
                "http://acme.org/fhir",
                "http://acme.org/fhir/ValueSet",
                "http://acme.org/fhir/ValueSet/123",
                "http://acme.org/fhir/ValueSet/123/_history",
                "http://acme.org/fhir/ValueSet/123/_history/5"
            ]);
            expect(prefixes.every((entry) => !entry.includes("?") && !entry.includes("#"))).to.be
                .true;
        });

        it("preserves raw scheme and authority casing", function () {
            const prefixes = buildUriHierarchyPrefixes(
                "HTTP://Example.ORG/fhir/ValueSet/123?q=1#frag"
            );

            expect(prefixes).to.deep.equal([
                "HTTP://Example.ORG",
                "HTTP://Example.ORG/fhir",
                "HTTP://Example.ORG/fhir/ValueSet",
                "HTTP://Example.ORG/fhir/ValueSet/123"
            ]);
        });

        it("preserves trailing slash semantics", function () {
            const prefixes = buildUriHierarchyPrefixes("http://acme.org/fhir/");

            expect(prefixes).to.deep.equal([
                "http://acme.org",
                "http://acme.org/fhir",
                "http://acme.org/fhir/"
            ]);
        });
    });

    describe("buildUriBelowMatcher", function () {
        it("matches descendants with a path boundary and case sensitivity", function () {
            const matcher = buildUriBelowMatcher("http://acme.org/fhir");

            expect(matcher.$regex.test("http://acme.org/fhir")).to.be.true;
            expect(matcher.$regex.test("http://acme.org/fhir/123")).to.be.true;
            expect(matcher.$regex.test("http://acme.org/fhir/")).to.be.false;
            expect(matcher.$regex.test("http://acme.org/fhirx")).to.be.false;
            expect(matcher.$regex.test("HTTP://acme.org/fhir")).to.be.false;
        });

        it("preserves trailing slash semantics for :below", function () {
            const matcher = buildUriBelowMatcher("http://acme.org/fhir/");

            expect(matcher.$regex.test("http://acme.org/fhir/")).to.be.true;
            expect(matcher.$regex.test("http://acme.org/fhir/123")).to.be.true;
            expect(matcher.$regex.test("http://acme.org/fhir")).to.be.false;
        });

        it("ignores query and fragment in the search prefix", function () {
            expect(getUriHierarchyBase("http://acme.org/fhir?x=1#frag")).to.equal(
                "http://acme.org/fhir"
            );
            expect(getUriHierarchyBase("HTTP://Example.ORG/fhir?x=1#frag")).to.equal(
                "HTTP://Example.ORG/fhir"
            );
        });
    });

    describe("buildUriSearchFilter", function () {
        const { buildUriSearchFilter } = require("@models/FHIR/searchParameter/executor/uriValueParser");
        const { buildPrimitiveFilter } = require("@models/FHIR/searchParameter/executor/primitives");

        it("matches buildPrimitiveFilter for uri search", function () {
            const value = "HTTP://Example.ORG/fhir/Patient/1";
            const projection = buildUriSearchFilter(value, "url", "above");
            const primitive = buildPrimitiveFilter("uri", value, "url", "above");

            expect(projection).to.deep.equal(primitive);
        });
    });
});
