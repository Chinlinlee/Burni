require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const {
    INSTANT_PRECISION,
    compareDecimal128,
    normalizeInstant
} = require("@models/FHIR/temporal");
const {
    parseInstantQueryValue,
    buildInstantQuery
} = require("@models/FHIR/searchParameter/executor/instantQueryBuilder");
const { parseTemporalQueryValue } = require("@models/FHIR/searchParameter/executor/temporalQueryParser");
const { buildTemporalFilter } = require("@models/FHIR/searchParameter/executor/temporalQueryFilter");

describe("instant query acceptance", function () {
    const FIELD = "effective";
    const EPOCH_FIELD = `${FIELD}.epochSeconds`;
    const COMPARATORS = ["eq", "ne", "lt", "gt", "ge", "le", "sa", "eb", "ap"];

    const PRECISION_FIXTURES = [
        {
            label: "second precision",
            bareValue: "2015-02-07T13:28:17Z",
            precision: INSTANT_PRECISION.SECOND,
            epochSeconds: "1423315697",
            apWindow: {
                gte: "1423315696.9",
                lte: "1423315697.1"
            }
        },
        {
            label: "fraction precision with offset",
            bareValue: "2015-02-07T13:28:17.230456789+02:00",
            value: "2015-02-07T13:28:17.230456789+02:00",
            precision: INSTANT_PRECISION.FRACTION,
            fractionDigits: 9,
            epochSeconds: "1423308497.230456789",
            apWindow: {
                gte: "1423308497.2304567889",
                lte: "1423308497.2304567891"
            }
        }
    ];

    const HIGH_PRECISION_PAIR = [
        {
            value: "2020-01-01T00:00:00.123456789012345678Z",
            epochSeconds: "1577836800.123456789012345678"
        },
        {
            value: "2020-01-01T00:00:00.123456789012345679Z",
            epochSeconds: "1577836800.123456789012345679"
        }
    ];

    function decimal128(value) {
        return mongoose.Types.Decimal128.fromString(String(value));
    }

    function prefixedValue(comparator, bareValue) {
        return `${comparator}${bareValue}`;
    }

    function expectedInstantFilter(epochSeconds, comparator) {
        const point = decimal128(epochSeconds);
        switch (comparator) {
            case "eq":
                return { [EPOCH_FIELD]: { $eq: point } };
            case "ne":
                return { [EPOCH_FIELD]: { $ne: point } };
            case "lt":
            case "eb":
                return { [EPOCH_FIELD]: { $lt: point } };
            case "gt":
            case "sa":
                return { [EPOCH_FIELD]: { $gt: point } };
            case "ge":
                return { [EPOCH_FIELD]: { $gte: point } };
            case "le":
                return { [EPOCH_FIELD]: { $lte: point } };
            default:
                throw new Error(`Use apWindow for comparator ${comparator}`);
        }
    }

    function expectedApproximationFilter(apWindow) {
        return {
            [EPOCH_FIELD]: {
                $gte: decimal128(apWindow.gte),
                $lte: decimal128(apWindow.lte)
            }
        };
    }

    describe("normalizeInstant canonical object shape", function () {
        it("builds second-precision instant with Decimal128 epochSeconds", function () {
            const result = normalizeInstant("2015-02-07T13:28:17Z");

            expect(result.value).to.equal("2015-02-07T13:28:17Z");
            expect(result.precision).to.equal(INSTANT_PRECISION.SECOND);
            expect(result.fractionDigits).to.equal(undefined);
            expect(result.epochSeconds).to.be.instanceOf(mongoose.Types.Decimal128);
            expect(result.epochSeconds.toString()).to.equal("1423315697");
        });

        it("builds fraction-precision instant with value, fractionDigits, and epochSeconds", function () {
            const result = normalizeInstant("2015-02-07T13:28:17.230456789+02:00");

            expect(result).to.deep.equal({
                value: "2015-02-07T13:28:17.230456789+02:00",
                precision: INSTANT_PRECISION.FRACTION,
                fractionDigits: 9,
                epochSeconds: decimal128("1423308497.230456789")
            });
        });
    });

    describe("epoch fraction normalization across timezone equivalents", function () {
        it("maps offset and Z representations to the same Decimal128 point", function () {
            const offset = parseInstantQueryValue("2015-02-07T13:28:17.230456789+02:00");
            const utc = parseInstantQueryValue("2015-02-07T11:28:17.230456789Z");

            expect(offset.epochSeconds.toString()).to.equal("1423308497.230456789");
            expect(offset.epochSeconds.toString()).to.equal(utc.epochSeconds.toString());
            expect(offset.value).to.equal("2015-02-07T13:28:17.230456789+02:00");
            expect(utc.value).to.equal("2015-02-07T11:28:17.230456789Z");
        });

        it("matches normalizeInstant and parseTemporalQueryValue epochSeconds", function () {
            const canonical = normalizeInstant("2015-02-07T13:28:17.230456789+02:00");
            const parsed = parseTemporalQueryValue(
                "2015-02-07T13:28:17.230456789+02:00",
                "instant"
            );

            expect(parsed.epochSeconds.toString()).to.equal(canonical.epochSeconds.toString());
            expect(parsed).to.include({
                kind: "instant",
                precision: INSTANT_PRECISION.FRACTION,
                fractionDigits: 9,
                value: canonical.value
            });
        });
    });

    describe("high-precision ordering", function () {
        it("preserves distinct sub-nanosecond fraction digits in epochSeconds", function () {
            const [firstFixture, secondFixture] = HIGH_PRECISION_PAIR;
            const first = parseInstantQueryValue(firstFixture.value);
            const second = parseInstantQueryValue(secondFixture.value);

            expect(first.epochSeconds.toString()).to.equal(firstFixture.epochSeconds);
            expect(second.epochSeconds.toString()).to.equal(secondFixture.epochSeconds);
            expect(first.epochSeconds.toString()).to.not.equal(second.epochSeconds.toString());
        });

        it("orders high-precision instants with compareDecimal128", function () {
            const [firstFixture, secondFixture] = HIGH_PRECISION_PAIR;
            const first = parseInstantQueryValue(firstFixture.value);
            const second = parseInstantQueryValue(secondFixture.value);

            expect(compareDecimal128(first.epochSeconds, second.epochSeconds)).to.be.lessThan(0);
            expect(compareDecimal128(second.epochSeconds, first.epochSeconds)).to.be.greaterThan(0);
            expect(compareDecimal128(first.epochSeconds, first.epochSeconds)).to.equal(0);
        });

        it("builds lt/gt filters that distinguish sub-nanosecond instants", function () {
            const [firstFixture, secondFixture] = HIGH_PRECISION_PAIR;
            const first = parseInstantQueryValue(firstFixture.value);
            const second = parseInstantQueryValue(secondFixture.value);

            expect(buildInstantQuery(FIELD, first, "lt")).to.deep.equal({
                [EPOCH_FIELD]: { $lt: first.epochSeconds }
            });
            expect(buildInstantQuery(FIELD, second, "gt")).to.deep.equal({
                [EPOCH_FIELD]: { $gt: second.epochSeconds }
            });
            expect(
                compareDecimal128(first.epochSeconds, second.epochSeconds)
            ).to.be.lessThan(0);
        });
    });

    describe("parseTemporalQueryValue", function () {
        for (const fixture of PRECISION_FIXTURES) {
            it(`preserves ${fixture.label} canonical query shape`, function () {
                const parsed = parseTemporalQueryValue(fixture.bareValue, "instant");

                expect(parsed.rawValue).to.equal(fixture.bareValue);
                expect(parsed.value).to.equal(fixture.value ?? fixture.bareValue);
                expect(parsed.kind).to.equal("instant");
                expect(parsed.precision).to.equal(fixture.precision);
                expect(parsed.epochSeconds).to.be.instanceOf(mongoose.Types.Decimal128);
                expect(parsed.epochSeconds.toString()).to.equal(fixture.epochSeconds);

                if (fixture.fractionDigits !== undefined) {
                    expect(parsed.fractionDigits).to.equal(fixture.fractionDigits);
                } else {
                    expect(parsed.fractionDigits).to.equal(undefined);
                }
            });
        }

        it("keeps comparator prefixes for every declared comparator", function () {
            for (const fixture of PRECISION_FIXTURES) {
                for (const comparator of COMPARATORS) {
                    const rawValue = prefixedValue(comparator, fixture.bareValue);
                    const parsed = parseTemporalQueryValue(rawValue, "instant");

                    expect(parsed).to.include({
                        rawValue,
                        value: fixture.value ?? fixture.bareValue,
                        kind: "instant",
                        precision: fixture.precision,
                        comparator
                    });
                    expect(parsed.epochSeconds.toString()).to.equal(fixture.epochSeconds);
                }
            }
        });
    });

    describe("buildInstantQuery", function () {
        for (const fixture of PRECISION_FIXTURES) {
            for (const comparator of COMPARATORS.filter((entry) => entry !== "ap")) {
                it(`builds ${comparator} filter for ${fixture.label}`, function () {
                    const rawValue = prefixedValue(comparator, fixture.bareValue);
                    const query = parseInstantQueryValue(rawValue);
                    const filter = buildInstantQuery(FIELD, query, comparator);

                    expect(filter).to.deep.equal(
                        expectedInstantFilter(fixture.epochSeconds, comparator)
                    );
                });
            }

            it(`builds deterministic ap window for ${fixture.label}`, function () {
                const rawValue = prefixedValue("ap", fixture.bareValue);
                const query = parseInstantQueryValue(rawValue);
                const first = buildInstantQuery(FIELD, query, "ap");
                const second = buildInstantQuery(FIELD, query, "ap");

                expect(first).to.deep.equal(expectedApproximationFilter(fixture.apWindow));
                expect(first).to.deep.equal(second);
            });
        }
    });

    describe("buildTemporalFilter", function () {
        for (const fixture of PRECISION_FIXTURES) {
            for (const comparator of COMPARATORS) {
                it(`routes ${comparator} instant query through temporal filter seam for ${fixture.label}`, function () {
                    const rawValue = prefixedValue(comparator, fixture.bareValue);
                    const temporal = parseTemporalQueryValue(rawValue, "instant");
                    const filter = buildTemporalFilter(FIELD, "instant", temporal, comparator);
                    const expected =
                        comparator === "ap"
                            ? expectedApproximationFilter(fixture.apWindow)
                            : expectedInstantFilter(fixture.epochSeconds, comparator);

                    expect(filter).to.deep.equal(expected);
                });
            }
        }

        it("uses instant point comparison without range normalization", function () {
            const temporal = parseTemporalQueryValue("eq2015-02-07T13:28:17Z", "instant");

            expect(temporal.range).to.equal(undefined);
            expect(temporal.queryStart).to.equal(undefined);
            expect(temporal.queryEnd).to.equal(undefined);
            expect(buildTemporalFilter(FIELD, "instant", temporal, "eq")).to.deep.equal({
                [EPOCH_FIELD]: { $eq: decimal128("1423315697") }
            });
        });
    });
});
