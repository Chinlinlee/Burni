require("module-alias/register");

const _ = require("lodash");
const { expect } = require("chai");
const { assertSafeFilter } = require("@models/FHIR/searchParameter/executor/mongoExecutor");
const { buildCompositePairFilter } = require("@models/FHIR/searchParameter/executor/compositeFilterBuilder");
const { validateAndBuildCompositeFilter } = require("@models/FHIR/searchParameter/executor/compositeQueryExecutor");
const { parseValueToken } = require("@models/FHIR/searchParameter/executor/queryValueParser");
const { minimalCompositePlan } = require("../support/composite-fixtures");

/**
 * @param {*} actual
 * @param {*} expected
 * @returns {boolean}
 */
function valueMatches(actual, expected) {
    if (_.isPlainObject(expected)) {
        if (Object.prototype.hasOwnProperty.call(expected, "$gt")) {
            return actual > expected.$gt;
        }
        if (Object.prototype.hasOwnProperty.call(expected, "$gte")) {
            return actual >= expected.$gte;
        }
        if (Object.prototype.hasOwnProperty.call(expected, "$lt")) {
            return actual < expected.$lt;
        }
        if (Object.prototype.hasOwnProperty.call(expected, "$lte")) {
            return actual <= expected.$lte;
        }
        if (Object.prototype.hasOwnProperty.call(expected, "$eq")) {
            return _.isEqual(actual, expected.$eq);
        }
        return Object.entries(expected).every(([key, nestedExpected]) =>
            valueMatches(actual?.[key], nestedExpected)
        );
    }
    return _.isEqual(actual, expected);
}

/**
 * @param {Object} document
 * @param {Object} filter
 * @returns {boolean}
 */
function matchesFilter(document, filter) {
    if (filter.$and) {
        return filter.$and.every((clause) => matchesFilter(document, clause));
    }
    if (filter.$or) {
        return filter.$or.some((clause) => matchesFilter(document, clause));
    }

    const elemMatchEntry = Object.entries(filter).find(
        ([key, value]) => !key.startsWith("$") && _.isPlainObject(value) && value.$elemMatch
    );
    if (elemMatchEntry) {
        const [path, value] = elemMatchEntry;
        const arrayValue = _.get(document, path);
        if (!Array.isArray(arrayValue)) {
            return false;
        }
        return arrayValue.some((entry) => matchesFilter(entry, value.$elemMatch));
    }

    return Object.entries(filter).every(([path, expected]) =>
        valueMatches(_.get(document, path), expected)
    );
}

/**
 * @param {string[]} components
 * @returns {import('@models/FHIR/searchParameter/executor/compositeValueParser').ParsedCompositeComponentToken[]}
 */
function componentTokens(components) {
    const plan = minimalCompositePlan();
    return components.map((value, index) =>
        parseValueToken(value, plan.composite.components[index].searchType, undefined)
    );
}

describe("composite correlated filter builder", function () {
    const plan = minimalCompositePlan();

    it("wraps component filters in a single array scope $elemMatch", function () {
        const filter = buildCompositePairFilter(
            plan,
            componentTokens(["http://loinc.org|8867-4", "gt5.4|http://unitsofmeasure.org|{score}"])
        );

        assertSafeFilter(filter);
        expect(filter).to.have.nested.property("component.$elemMatch");
        expect(filter.component.$elemMatch).to.have.property("$and");
        expect(JSON.stringify(filter)).to.not.match(/component\.\d+\./);
    });

    it("matches when both component values live on the same array element", function () {
        const filter = buildCompositePairFilter(
            plan,
            componentTokens(["http://loinc.org|8867-4", "gt5.4|http://unitsofmeasure.org|{score}"])
        );

        expect(filter).to.have.nested.property("component.$elemMatch.$and");
        expect(JSON.stringify(filter)).to.include("8867-4");
        expect(JSON.stringify(filter)).to.include('"$gt":5.4');
    });

    it("does not cross-match different array elements", function () {
        const filter = buildCompositePairFilter(
            plan,
            componentTokens(["http://loinc.org|8867-4", "gt5.4|http://unitsofmeasure.org|{score}"])
        );
        const document = {
            component: [
                {
                    code: { coding: [{ system: "http://loinc.org", code: "8867-4" }] },
                    valueQuantity: { value: 2, system: "http://unitsofmeasure.org", code: "{score}" }
                },
                {
                    code: { coding: [{ system: "http://loinc.org", code: "29463-7" }] },
                    valueQuantity: { value: 6, system: "http://unitsofmeasure.org", code: "{score}" }
                }
            ]
        };

        expect(matchesFilter(document, filter)).to.equal(false);
    });

    it("OR-combines comma-separated Pairs from one parameter value", function () {
        const result = validateAndBuildCompositeFilter(
            plan,
            "http://loinc.org|8867-4$gt5.4|http://unitsofmeasure.org|{score},http://loinc.org|29463-7$lt10|http://unitsofmeasure.org|{score}",
            "component-code-value-quantity"
        );

        expect(result.valid).to.equal(true);
        assertSafeFilter(result.filter);
        expect(result.filter).to.have.property("$or");
        expect(result.filter.$or).to.have.length(2);
        expect(result.filter.$or[0]).to.have.nested.property("component.$elemMatch");
        expect(result.filter.$or[1]).to.have.nested.property("component.$elemMatch");
    });

    it("AND-combines repeated composite parameter values", function () {
        const result = validateAndBuildCompositeFilter(
            plan,
            [
                "http://loinc.org|8867-4$gt5.4|http://unitsofmeasure.org|{score}",
                "http://loinc.org|29463-7$lt10|http://unitsofmeasure.org|{score}"
            ],
            "component-code-value-quantity"
        );

        expect(result.valid).to.equal(true);
        assertSafeFilter(result.filter);
        expect(result.filter).to.have.property("$and");
        expect(result.filter.$and).to.have.length(2);
        expect(result.filter.$and[0]).to.have.nested.property("component.$elemMatch");
        expect(result.filter.$and[1]).to.have.nested.property("component.$elemMatch");
    });

    it("rejects invalid primitive component values", function () {
        const result = validateAndBuildCompositeFilter(
            plan,
            "http://loinc.org|8867-4$not-a-number",
            "component-code-value-quantity"
        );

        expect(result.valid).to.equal(false);
        expect(result.reason).to.include("invalid quantity");
    });
});
