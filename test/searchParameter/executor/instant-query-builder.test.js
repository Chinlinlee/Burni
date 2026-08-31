require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const {
    parseInstantQueryValue,
    buildInstantQuery
} = require("@models/FHIR/searchParameter/executor/instantQueryBuilder");
const { parseTemporalQueryValue } = require("@models/FHIR/searchParameter/executor/temporalQueryParser");
const { buildTemporalFilter } = require("@models/FHIR/searchParameter/executor/temporalQueryFilter");
const { TEMPORAL_ERROR_CODE } = require("@models/FHIR/temporal");

describe("FHIR instant query builder", function () {
    it("normalizes equivalent timezone representations to one Decimal128 point", function () {
        const offset = parseInstantQueryValue("2015-02-07T13:28:17.230456789+02:00");
        const utc = parseInstantQueryValue("2015-02-07T11:28:17.230456789Z");

        expect(offset.epochSeconds).to.be.instanceOf(mongoose.Types.Decimal128);
        expect(offset.epochSeconds.toString()).to.equal("1423308497.230456789");
        expect(offset.epochSeconds.toString()).to.equal(utc.epochSeconds.toString());
        expect(offset.value).to.equal("2015-02-07T13:28:17.230456789+02:00");
        expect(offset.precision).to.equal("fraction");
        expect(offset.fractionDigits).to.equal(9);
    });

    it("keeps high-precision fractional seconds in the point value", function () {
        const first = parseInstantQueryValue(
            "2020-01-01T00:00:00.123456789012345678Z"
        );
        const second = parseInstantQueryValue(
            "2020-01-01T00:00:00.123456789012345679Z"
        );

        expect(first.epochSeconds.toString()).to.equal("1577836800.123456789012345678");
        expect(second.epochSeconds.toString()).to.equal("1577836800.123456789012345679");
        expect(first.epochSeconds.toString()).to.not.equal(second.epochSeconds.toString());
    });

    it("builds Decimal128 point filters for every instant comparator", function () {
        const comparators = {
            eq: "$eq",
            ne: "$ne",
            lt: "$lt",
            gt: "$gt",
            ge: "$gte",
            le: "$lte",
            sa: "$gt",
            eb: "$lt"
        };
        const query = parseInstantQueryValue("2015-02-07T13:28:17Z");

        for (const [comparator, operator] of Object.entries(comparators)) {
            const filter = buildInstantQuery("effective", query, comparator);
            expect(filter["effective.epochSeconds"][operator]).to.be.instanceOf(
                mongoose.Types.Decimal128
            );
            expect(filter["effective.epochSeconds"][operator].toString()).to.equal(
                "1423315697"
            );
        }

        const prefixed = parseInstantQueryValue("ge2015-02-07T13:28:17Z");
        expect(prefixed.comparator).to.equal("ge");
        expect(prefixed.value).to.equal("2015-02-07T13:28:17Z");
    });

    it("builds a deterministic Decimal128 approximation window", function () {
        const second = parseInstantQueryValue("2015-02-07T13:28:17Z");
        const fraction = parseInstantQueryValue("2015-02-07T13:28:17.2300Z");

        const secondFilter = buildInstantQuery("effective", second, "ap");
        const fractionFilter = buildInstantQuery("effective", fraction, "ap");

        expect(secondFilter["effective.epochSeconds"].$gte.toString()).to.equal(
            "1423315696.9"
        );
        expect(secondFilter["effective.epochSeconds"].$lte.toString()).to.equal(
            "1423315697.1"
        );
        expect(fractionFilter["effective.epochSeconds"].$gte.toString()).to.equal(
            "1423315697.22999"
        );
        expect(fractionFilter["effective.epochSeconds"].$lte.toString()).to.equal(
            "1423315697.23001"
        );
    });

    it("uses the instant point builder through the temporal query seam", function () {
        const parsed = parseTemporalQueryValue("eq2015-02-07T13:28:17Z", "instant");
        const filter = buildTemporalFilter(
            "effective",
            "instant",
            parsed,
            parsed.comparator
        );

        expect(parsed.kind).to.equal("instant");
        expect(filter["effective.epochSeconds"].$eq).to.be.instanceOf(
            mongoose.Types.Decimal128
        );
        expect(filter["effective.epochSeconds"].$eq.toString()).to.equal(
            "1423315697"
        );
    });

    it("rejects partial precision and missing timezone inputs", function () {
        expect(() => parseInstantQueryValue("2015-02-07T13:28Z")).to.throw(
            /Invalid FHIR instant|precision/
        );
        expect(() => parseInstantQueryValue("2015-02-07T13:28:17")).to.throw().with.property(
            "code",
            TEMPORAL_ERROR_CODE.MISSING_INSTANT_TIMEZONE
        );
        expect(() => buildInstantQuery("effective", {
            kind: "instant",
            precision: "minute",
            epochSeconds: mongoose.Types.Decimal128.fromString("1")
        })).to.throw(/precision/);
    });
});
