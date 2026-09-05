require("module-alias/register");

const { expect } = require("chai");
const {
    parseCompositeSearchValue,
    preservePrimitiveEscapes
} = require("@models/FHIR/searchParameter/executor/compositeValueParser");
const {
    validateCompositeParameterName
} = require("@models/FHIR/searchParameter/executor/compositeQueryExecutor");
const { minimalCompositePlan } = require("../support/composite-fixtures");

const COMPONENT_COUNT = 2;

/**
 * @param {ReturnType<typeof parseCompositeSearchValue>} parsed
 * @returns {string[][]}
 */
function pairComponents(parsed) {
    return parsed.groups.flatMap((group) => group.pairs.map((pair) => pair.components));
}

describe("composite value parser", function () {
    it("parses a single Pair into fixed component tokens", function () {
        const parsed = parseCompositeSearchValue("http://loinc.org|8867-4$gt5.4", COMPONENT_COUNT);

        expect(pairComponents(parsed)).to.deep.equal([["http://loinc.org|8867-4", "gt5.4"]]);
        expect(parsed.conjunction).to.equal("or");
    });

    it("splits comma-separated Pairs into OR groups within one parameter value", function () {
        const parsed = parseCompositeSearchValue(
            "pair-a-token$pair-a-value,pair-b-token$pair-b-value",
            COMPONENT_COUNT
        );

        expect(pairComponents(parsed)).to.deep.equal([
            ["pair-a-token", "pair-a-value"],
            ["pair-b-token", "pair-b-value"]
        ]);
        expect(parsed.conjunction).to.equal("or");
    });

    it("combines repeated query parameter values with AND", function () {
        const parsed = parseCompositeSearchValue(
            ["token-a$value-a", "token-b$value-b"],
            COMPONENT_COUNT
        );

        expect(pairComponents(parsed)).to.deep.equal([
            ["token-a", "value-a"],
            ["token-b", "value-b"]
        ]);
        expect(parsed.conjunction).to.equal("and");
    });

    it("restores escaped composite separators in component literals", function () {
        const parsed = parseCompositeSearchValue(
            "literal\\$token\\,part|pipe$literal\\\\tail",
            COMPONENT_COUNT
        );

        expect(pairComponents(parsed)).to.deep.equal([
            ["literal$token,part|pipe", "literal\\tail"]
        ]);
    });

    it("keeps escaped pipes literal for token and quantity primitive parsers", function () {
        expect(preservePrimitiveEscapes("literal\\|pipe", "token")).to.equal("literal\\|pipe");
        expect(preservePrimitiveEscapes("literal\\|pipe", "quantity")).to.equal(
            "literal\\|pipe"
        );
        expect(preservePrimitiveEscapes("literal\\|pipe", "string")).to.equal("literal|pipe");
    });

    it("rejects composite parameter modifiers", function () {
        const plan = minimalCompositePlan();
        const validation = validateCompositeParameterName(plan, "exact");

        expect(validation.valid).to.equal(false);
        expect(validation.reason).to.include("do not support modifiers");
    });

    it("rejects values without a component separator", function () {
        expect(() => parseCompositeSearchValue("only-one-component", COMPONENT_COUNT)).to.throw(
            /exactly 2 components/i
        );
    });

    it("rejects empty component tokens", function () {
        expect(() => parseCompositeSearchValue("$right-only", COMPONENT_COUNT)).to.throw(
            /must not be empty/i
        );
    });

    it("rejects too many component tokens", function () {
        expect(() => parseCompositeSearchValue("a$b$c", COMPONENT_COUNT)).to.throw(
            /exactly 2 components/i
        );
    });

    it("rejects trailing escape sequences", function () {
        expect(() => parseCompositeSearchValue("left$right\\", COMPONENT_COUNT)).to.throw(
            /Trailing escape/i
        );
    });
});
