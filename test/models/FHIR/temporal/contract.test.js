require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const {
    DATE_PRECISION,
    DATETIME_PRECISION,
    INSTANT_PRECISION,
    DATE_PATTERN,
    DATETIME_PATTERN,
    INSTANT_PATTERN,
    inferDatePrecision,
    inferDateTimePrecision,
    inferInstantPrecision,
    isCalendarDate,
    isLeapYear,
    daysInMonth,
    compareCalendarDates,
    expectedDateBoundaries,
    APPROXIMATION_RATIO,
    approximateCalendarRange,
    approximateDecimalRange,
    isDecimal128,
    compareDecimal128,
    validateCanonicalDate,
    validateCanonicalDateTime,
    validateCanonicalInstant
} = require("@models/FHIR/temporal");

function decimal128(value) {
    return mongoose.Types.Decimal128.fromString(String(value));
}

describe("FHIR temporal contract", function () {
    describe("precision constants", function () {
        it("exports date precision values", function () {
            expect(DATE_PRECISION).to.deep.equal({
                YEAR: "year",
                MONTH: "month",
                DAY: "day"
            });
        });

        it("exports dateTime precision values", function () {
            expect(DATETIME_PRECISION).to.deep.equal({
                YEAR: "year",
                MONTH: "month",
                DAY: "day",
                MINUTE: "minute",
                SECOND: "second",
                FRACTION: "fraction"
            });
        });

        it("exports instant precision values", function () {
            expect(INSTANT_PRECISION).to.deep.equal({
                SECOND: "second",
                FRACTION: "fraction"
            });
        });
    });

    describe("FHIR lexical patterns", function () {
        it("accepts valid date values", function () {
            expect(DATE_PATTERN.test("1995")).to.be.true;
            expect(DATE_PATTERN.test("1995-06")).to.be.true;
            expect(DATE_PATTERN.test("1995-06-15")).to.be.true;
        });

        it("rejects invalid date values", function () {
            expect(DATE_PATTERN.test("1995-13")).to.be.false;
            expect(DATE_PATTERN.test("1995-06-15T00:00:00Z")).to.be.false;
        });

        it("accepts valid dateTime values", function () {
            expect(DATETIME_PATTERN.test("2015-02")).to.be.true;
            expect(DATETIME_PATTERN.test("2015-02-09T16:04:15.817Z")).to.be.true;
            expect(DATETIME_PATTERN.test("2015-02-07T13:28:17+02:00")).to.be.true;
        });

        it("accepts valid instant values", function () {
            expect(INSTANT_PATTERN.test("2015-02-07T13:28:17Z")).to.be.true;
            expect(INSTANT_PATTERN.test("2015-02-07T13:28:17.230456789+02:00")).to.be.true;
        });

        it("rejects instant values without timezone", function () {
            expect(INSTANT_PATTERN.test("2015-02-07T13:28:17")).to.be.false;
        });
    });

    describe("lexical precision inference", function () {
        it("infers date precision from value", function () {
            expect(inferDatePrecision("1995")).to.equal(DATE_PRECISION.YEAR);
            expect(inferDatePrecision("1995-06")).to.equal(DATE_PRECISION.MONTH);
            expect(inferDatePrecision("1995-06-15")).to.equal(DATE_PRECISION.DAY);
        });

        it("infers dateTime precision from value", function () {
            expect(inferDateTimePrecision("2015-02")).to.deep.equal({
                precision: DATETIME_PRECISION.MONTH
            });
            expect(inferDateTimePrecision("2015-02-07T13:28:17+02:00")).to.deep.equal({
                precision: DATETIME_PRECISION.SECOND
            });
            expect(inferDateTimePrecision("2015-02-09T16:04:15.817Z")).to.deep.equal({
                precision: DATETIME_PRECISION.FRACTION,
                fractionDigits: 3
            });
        });

        it("infers instant precision from value", function () {
            expect(inferInstantPrecision("2015-02-07T13:28:17Z")).to.deep.equal({
                precision: INSTANT_PRECISION.SECOND
            });
            expect(inferInstantPrecision("2015-02-07T13:28:17.230456789+02:00")).to.deep.equal({
                precision: INSTANT_PRECISION.FRACTION,
                fractionDigits: 9
            });
        });
    });

    describe("calendar helpers", function () {
        it("identifies Gregorian leap years", function () {
            expect(isLeapYear(2000)).to.equal(true);
            expect(isLeapYear(1900)).to.equal(false);
            expect(isLeapYear(2020)).to.equal(true);
            expect(isLeapYear(2021)).to.equal(false);
        });

        it("returns days in month including February leap days", function () {
            expect(daysInMonth(2020, 2)).to.equal(29);
            expect(daysInMonth(2021, 2)).to.equal(28);
            expect(daysInMonth(2021, 4)).to.equal(30);
            expect(daysInMonth(2021, 1)).to.equal(31);
        });

        it("validates calendar dates", function () {
            expect(isCalendarDate("1995-06-15")).to.be.true;
            expect(isCalendarDate("1995-02-29")).to.be.false;
            expect(isCalendarDate("1996-02-29")).to.be.true;
            expect(isCalendarDate("0004-02-29")).to.be.true;
            expect(isCalendarDate("0099-02-29")).to.be.false;
            expect(isCalendarDate("9999-12-31")).to.be.true;
        });

        it("compares calendar dates", function () {
            expect(compareCalendarDates("1995-06-01", "1995-07-01")).to.be.lessThan(0);
            expect(compareCalendarDates("1995-07-01", "1995-06-01")).to.be.greaterThan(0);
        });

        it("derives expected date boundaries", function () {
            expect(expectedDateBoundaries("0001", DATE_PRECISION.YEAR)).to.deep.equal({
                normalizedStart: "0001-01-01",
                normalizedEnd: "0002-01-01"
            });
            expect(expectedDateBoundaries("0099-12", DATE_PRECISION.MONTH)).to.deep.equal({
                normalizedStart: "0099-12-01",
                normalizedEnd: "0100-01-01"
            });
            expect(expectedDateBoundaries("0099-12-31", DATE_PRECISION.DAY)).to.deep.equal({
                normalizedStart: "0099-12-31",
                normalizedEnd: "0100-01-01"
            });
            expect(expectedDateBoundaries("1995", DATE_PRECISION.YEAR)).to.deep.equal({
                normalizedStart: "1995-01-01",
                normalizedEnd: "1996-01-01"
            });
            expect(expectedDateBoundaries("1995-06", DATE_PRECISION.MONTH)).to.deep.equal({
                normalizedStart: "1995-06-01",
                normalizedEnd: "1995-07-01"
            });
            expect(expectedDateBoundaries("1995-06-15", DATE_PRECISION.DAY)).to.deep.equal({
                normalizedStart: "1995-06-15",
                normalizedEnd: "1995-06-16"
            });
            expect(expectedDateBoundaries("0099-12-31", DATE_PRECISION.DAY)).to.deep.equal({
                normalizedStart: "0099-12-31",
                normalizedEnd: "0100-01-01"
            });
            expect(expectedDateBoundaries("9999", DATE_PRECISION.YEAR)).to.deep.equal({
                normalizedStart: "9999-01-01",
                normalizedEnd: "9999-12-31"
            });
            expect(expectedDateBoundaries("9999-12", DATE_PRECISION.MONTH)).to.deep.equal({
                normalizedStart: "9999-12-01",
                normalizedEnd: "9999-12-31"
            });
            expect(expectedDateBoundaries("9999-12-31", DATE_PRECISION.DAY)).to.deep.equal({
                normalizedStart: "9999-12-31",
                normalizedEnd: "9999-12-31"
            });
        });
    });

    describe("approximation helpers", function () {
        it("exports the FHIR 10 percent approximation ratio", function () {
            expect(APPROXIMATION_RATIO).to.equal(0.1);
        });

        it("expands a one-day calendar range by one day on each side", function () {
            expect(
                approximateCalendarRange({
                    start: "2020-02-29",
                    end: "2020-03-01"
                })
            ).to.deep.equal({
                kind: "date",
                start: "2020-02-28",
                end: "2020-03-02"
            });
        });

        it("expands a Decimal128 range by 10 percent of its width", function () {
            const approximated = approximateDecimalRange({
                start: decimal128("10"),
                end: decimal128("20")
            });

            expect(approximated.start).to.be.instanceOf(mongoose.Types.Decimal128);
            expect(approximated.end).to.be.instanceOf(mongoose.Types.Decimal128);
            expect(approximated.start.toString()).to.equal("9");
            expect(approximated.end.toString()).to.equal("21");
        });
    });

    describe("Decimal128 helpers", function () {
        it("recognizes Decimal128 values", function () {
            expect(isDecimal128(decimal128("1423320800"))).to.be.true;
            expect(isDecimal128("1423320800")).to.be.false;
        });

        it("compares Decimal128 values with fractional precision", function () {
            const lower = decimal128("1423320800.230");
            const higher = decimal128("1423320800.230456789");

            expect(compareDecimal128(lower, higher)).to.be.lessThan(0);
            expect(compareDecimal128(higher, lower)).to.be.greaterThan(0);
            expect(compareDecimal128(lower, lower)).to.equal(0);
        });
    });

    describe("validateCanonicalDate", function () {
        it("accepts a valid canonical date object", function () {
            const result = validateCanonicalDate({
                value: "1995-06",
                precision: DATE_PRECISION.MONTH,
                normalizedStart: "1995-06-01",
                normalizedEnd: "1995-07-01"
            });

            expect(result.valid).to.equal(true);
            expect(result.errors).to.deep.equal([]);
        });

        it("rejects invalid shape, precision, and boundaries", function () {
            const result = validateCanonicalDate({
                value: "1995-06",
                precision: DATE_PRECISION.DAY,
                normalizedStart: "1995-06-01",
                normalizedEnd: "1995-06-01",
                extra: true
            });

            expect(result.valid).to.equal(false);
            expect(result.errors).to.include("Canonical date has unexpected field: extra");
            expect(result.errors).to.include(
                "Canonical date.precision must match the lexical precision of value"
            );
            expect(result.errors).to.include(
                "Canonical date normalized boundaries must match value and precision"
            );
            expect(result.errors).to.include(
                "Canonical date.normalizedEnd must be after normalizedStart"
            );
        });
    });

    describe("validateCanonicalDateTime", function () {
        it("accepts a valid canonical dateTime object", function () {
            const result = validateCanonicalDateTime({
                value: "2015-02-09T16:04:15.817Z",
                precision: DATETIME_PRECISION.FRACTION,
                fractionDigits: 3,
                normalizedStart: decimal128("1423497855.817"),
                normalizedEnd: decimal128("1423497855.818")
            });

            expect(result.valid).to.equal(true);
            expect(result.errors).to.deep.equal([]);
        });

        it("rejects invalid Decimal128 boundaries and fractionDigits", function () {
            const result = validateCanonicalDateTime({
                value: "2015-02-09T16:04:15.817Z",
                precision: DATETIME_PRECISION.SECOND,
                fractionDigits: 3,
                normalizedStart: decimal128("1423497855.817"),
                normalizedEnd: decimal128("1423497855.817")
            });

            expect(result.valid).to.equal(false);
            expect(result.errors).to.include(
                "Canonical dateTime.fractionDigits must be omitted unless precision is fraction"
            );
            expect(result.errors).to.include(
                "Canonical dateTime.precision must match the lexical precision of value"
            );
            expect(result.errors).to.include(
                "Canonical dateTime.normalizedEnd must be after normalizedStart"
            );
            expect(result.errors).to.include(
                "Canonical dateTime normalized boundaries must match value and precision"
            );
        });
    });

    describe("validateCanonicalInstant", function () {
        it("accepts a valid canonical instant object", function () {
            const result = validateCanonicalInstant({
                value: "2015-02-07T13:28:17.230456789+02:00",
                precision: INSTANT_PRECISION.FRACTION,
                fractionDigits: 9,
                epochSeconds: decimal128("1423308497.230456789")
            });

            expect(result.valid).to.equal(true);
            expect(result.errors).to.deep.equal([]);
        });

        it("rejects invalid instant precision and epochSeconds type", function () {
            const result = validateCanonicalInstant({
                value: "2015-02-07T13:28:17Z",
                precision: INSTANT_PRECISION.FRACTION,
                epochSeconds: 1423313297
            });

            expect(result.valid).to.equal(false);
            expect(result.errors).to.include(
                "Canonical instant.precision must match the lexical precision of value"
            );
            expect(result.errors).to.include(
                "Canonical instant.fractionDigits must be a positive integer when precision is fraction"
            );
            expect(result.errors).to.include(
                "Canonical instant.epochSeconds must be a Decimal128 value"
            );
        });

        it("rejects instant epochSeconds that do not match value", function () {
            const result = validateCanonicalInstant({
                value: "2015-02-07T13:28:17Z",
                precision: INSTANT_PRECISION.SECOND,
                epochSeconds: decimal128("0")
            });

            expect(result.valid).to.equal(false);
            expect(result.errors).to.include("Canonical instant.epochSeconds must match value");
        });
    });
});
