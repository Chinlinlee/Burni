require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const {
    DATE_PRECISION,
    DATETIME_PRECISION,
    INSTANT_PRECISION
} = require("@models/FHIR/temporal");
const {
    convertLegacyTemporalValue,
    convertLegacyBsonDate,
    detectLegacyBsonDateAmbiguity,
    UTC_CALENDAR_DAY_LOSSY_POLICY,
    UTC_ABSOLUTE_TIME_LOSSY_POLICY,
    resolveBsonDateConversionPolicy
} = require("@models/FHIR/searchParameter/migration/temporalConversion");

describe("temporal migration conversion", function () {
    describe("date", function () {
        it("derives year, month, and day calendar boundaries", function () {
            expect(convertLegacyTemporalValue("1995", "date")).to.deep.equal({
                value: "1995",
                precision: DATE_PRECISION.YEAR,
                normalizedStart: "1995-01-01",
                normalizedEnd: "1996-01-01"
            });
            expect(convertLegacyTemporalValue("1995-06", "date")).to.deep.equal({
                value: "1995-06",
                precision: DATE_PRECISION.MONTH,
                normalizedStart: "1995-06-01",
                normalizedEnd: "1995-07-01"
            });
            expect(convertLegacyTemporalValue("1995-06-15", "date")).to.deep.equal({
                value: "1995-06-15",
                precision: DATE_PRECISION.DAY,
                normalizedStart: "1995-06-15",
                normalizedEnd: "1995-06-16"
            });
        });
    });

    describe("dateTime", function () {
        it("derives calendar precision boundaries as UTC Decimal128 values", function () {
            const cases = [
                {
                    value: "2015",
                    precision: DATETIME_PRECISION.YEAR,
                    start: Date.UTC(2015, 0, 1) / 1000,
                    end: Date.UTC(2016, 0, 1) / 1000
                },
                {
                    value: "2015-02",
                    precision: DATETIME_PRECISION.MONTH,
                    start: Date.UTC(2015, 1, 1) / 1000,
                    end: Date.UTC(2015, 2, 1) / 1000
                },
                {
                    value: "2015-02-07",
                    precision: DATETIME_PRECISION.DAY,
                    start: Date.UTC(2015, 1, 7) / 1000,
                    end: Date.UTC(2015, 1, 8) / 1000
                }
            ];

            for (const testCase of cases) {
                const result = convertLegacyTemporalValue(testCase.value, "dateTime");
                expect(result.value).to.equal(testCase.value);
                expect(result.precision).to.equal(testCase.precision);
                expect(result.normalizedStart.toString()).to.equal(String(testCase.start));
                expect(result.normalizedEnd.toString()).to.equal(String(testCase.end));
            }
        });

        it("derives minute and second boundaries with offset normalization", function () {
            const minute = convertLegacyTemporalValue(
                "2015-02-07T13:28+02:00",
                "dateTime"
            );
            expect(minute.precision).to.equal(DATETIME_PRECISION.MINUTE);
            expect(minute.normalizedStart.toString()).to.equal("1423308480");
            expect(minute.normalizedEnd.toString()).to.equal("1423308540");

            const second = convertLegacyTemporalValue(
                "2015-02-07T13:28:17+02:00",
                "dateTime"
            );
            expect(second.precision).to.equal(DATETIME_PRECISION.SECOND);
            expect(second.normalizedStart.toString()).to.equal("1423308497");
            expect(second.normalizedEnd.toString()).to.equal("1423308498");
        });

        it("preserves fractional trailing zeros while normalizing the UTC boundary", function () {
            const result = convertLegacyTemporalValue(
                "2015-02-07T13:28:17.2300+02:00",
                "dateTime"
            );

            expect(result).to.include({
                value: "2015-02-07T13:28:17.2300+02:00",
                precision: DATETIME_PRECISION.FRACTION,
                fractionDigits: 4
            });
            expect(result.normalizedStart.toString()).to.equal("1423308497.2300");
            expect(result.normalizedEnd.toString()).to.equal("1423308497.2301");
        });

        it("uses UTC for a timezone-less legacy dateTime", function () {
            const result = convertLegacyTemporalValue(
                "2015-02-07T13:28:17",
                "dateTime"
            );

            expect(result.normalizedStart.toString()).to.equal("1423315697");
            expect(result.normalizedEnd.toString()).to.equal("1423315698");
        });

        it("keeps fractional seconds correct before the Unix epoch", function () {
            const result = convertLegacyTemporalValue(
                "1969-12-31T23:59:59.5Z",
                "dateTime"
            );

            expect(result.normalizedStart.toString()).to.equal("-0.5");
            expect(result.normalizedEnd.toString()).to.equal("-0.4");
        });
    });

    describe("instant", function () {
        it("derives second precision epoch seconds", function () {
            const result = convertLegacyTemporalValue(
                "2015-02-07T13:28:17Z",
                "instant"
            );

            expect(result).to.include({
                value: "2015-02-07T13:28:17Z",
                precision: INSTANT_PRECISION.SECOND
            });
            expect(result.epochSeconds.toString()).to.equal("1423315697");
        });

        it("preserves fraction digits and offset while deriving Decimal128 epoch seconds", function () {
            const result = convertLegacyTemporalValue(
                "2015-02-07T13:28:17.230456789+02:00",
                "instant"
            );

            expect(result).to.include({
                value: "2015-02-07T13:28:17.230456789+02:00",
                precision: INSTANT_PRECISION.FRACTION,
                fractionDigits: 9
            });
            expect(result.epochSeconds.toString()).to.equal("1423308497.230456789");
        });

        it("keeps fractional seconds correct before the Unix epoch", function () {
            const result = convertLegacyTemporalValue(
                "1969-12-31T23:59:59.5Z",
                "instant"
            );

            expect(result.epochSeconds.toString()).to.equal("-0.5");
        });
    });

    describe("legacy BSON Date", function () {
        it("exports UTC lossy conversion policy constants", function () {
            expect(UTC_CALENDAR_DAY_LOSSY_POLICY).to.equal("utc-calendar-day-lossy");
            expect(UTC_ABSOLUTE_TIME_LOSSY_POLICY).to.equal("utc-absolute-time-lossy");
            expect(resolveBsonDateConversionPolicy("date")).to.equal(
                UTC_CALENDAR_DAY_LOSSY_POLICY
            );
            expect(resolveBsonDateConversionPolicy("dateTime")).to.equal(
                UTC_ABSOLUTE_TIME_LOSSY_POLICY
            );
            expect(resolveBsonDateConversionPolicy("instant")).to.equal(
                UTC_ABSOLUTE_TIME_LOSSY_POLICY
            );
        });

        it("converts an absolute dateTime to a UTC millisecond canonical value", function () {
            const legacyDate = new Date("2015-02-07T13:28:17.230+02:00");
            const result = convertLegacyBsonDate(
                legacyDate,
                "dateTime",
                "Observation.effectiveDateTime"
            );

            expect(result).to.include({
                value: "2015-02-07T11:28:17.230Z",
                precision: DATETIME_PRECISION.FRACTION,
                fractionDigits: 3
            });
            expect(result.normalizedStart.toString()).to.equal("1423308497.230");
            expect(result.normalizedEnd.toString()).to.equal("1423308497.231");
            expect(legacyDate.toISOString()).to.equal("2015-02-07T11:28:17.230Z");
        });

        it("converts an absolute instant without reducing Decimal128 to a number", function () {
            const result = convertLegacyBsonDate(
                new Date("2020-01-15T00:00:00.001Z"),
                "instant",
                "Patient.meta.lastUpdated"
            );

            expect(result).to.include({
                value: "2020-01-15T00:00:00.001Z",
                precision: INSTANT_PRECISION.FRACTION,
                fractionDigits: 3
            });
            expect(result.epochSeconds).to.be.instanceOf(mongoose.Types.Decimal128);
            expect(result.epochSeconds.toString()).to.equal("1579046400.001");
        });

        it("rejects invalid BSON Dates with the input path", function () {
            try {
                convertLegacyBsonDate(
                    new Date(Number.NaN),
                    "instant",
                    "Patient.meta.lastUpdated"
                );
                expect.fail("expected conversion to fail");
            } catch (error) {
                expect(error).to.have.property("path", "Patient.meta.lastUpdated");
                expect(error.message).to.match(/invalid time/);
            }
        });

        it("converts a date BSON Date at midnight UTC to a day-precision canonical date", function () {
            const legacyDate = new Date("2020-01-15T00:00:00.000Z");
            const result = convertLegacyBsonDate(legacyDate, "date", "Patient.birthDate", {
                resource: "Patient",
                model: "Patient"
            });

            expect(result).to.deep.equal({
                value: "2020-01-15",
                precision: DATE_PRECISION.DAY,
                normalizedStart: "2020-01-15",
                normalizedEnd: "2020-01-16"
            });
            expect(convertLegacyTemporalValue(legacyDate, "date", "Patient.birthDate")).to.deep.equal(
                result
            );
        });

        it("converts a date BSON Date with a time component using the UTC calendar day only", function () {
            const legacyDate = new Date("2020-01-16T02:00:00+05:00");
            const result = convertLegacyBsonDate(legacyDate, "date", "Patient.birthDate");

            expect(result).to.deep.equal({
                value: "2020-01-15",
                precision: DATE_PRECISION.DAY,
                normalizedStart: "2020-01-15",
                normalizedEnd: "2020-01-16"
            });
            expect(legacyDate.toISOString()).to.equal("2020-01-15T21:00:00.000Z");
        });

        it("classifies date BSON Date as absolute lossy conversion, not ambiguous", function () {
            const legacyDate = new Date("2020-01-15T00:00:00.000Z");
            const result = detectLegacyBsonDateAmbiguity(
                legacyDate,
                "date",
                "Patient.birthDate",
                { resource: "Patient", model: "Patient" }
            );

            expect(result).to.include({
                ambiguous: false,
                category: "absolute-bson-date",
                policy: UTC_CALENDAR_DAY_LOSSY_POLICY,
                temporalType: "date",
                resource: "Patient",
                model: "Patient",
                path: "Patient.birthDate",
                value: legacyDate
            });
            expect(result).to.not.have.property("code");
        });

        it("does not classify absolute BSON Dates as ambiguous", function () {
            const legacyDate = new Date("2020-01-15T00:00:00.001Z");

            for (const type of ["dateTime", "instant"]) {
                const result = detectLegacyBsonDateAmbiguity(legacyDate, type, "value");

                expect(result.ambiguous).to.equal(false);
                expect(result.category).to.equal("absolute-bson-date");
                expect(result.policy).to.equal(UTC_ABSOLUTE_TIME_LOSSY_POLICY);
            }
        });

        it("classifies date BSON Date with UTC calendar day lossy policy", function () {
            const legacyDate = new Date("2020-01-15T23:59:59+02:00");
            const result = detectLegacyBsonDateAmbiguity(legacyDate, "date", "Patient.birthDate");

            expect(result).to.include({
                ambiguous: false,
                category: "absolute-bson-date",
                policy: UTC_CALENDAR_DAY_LOSSY_POLICY,
                temporalType: "date",
                path: "Patient.birthDate",
                value: legacyDate
            });
        });
    });

    describe("idempotent conversion", function () {
        it("returns deep-equal results when converting a legacy string twice", function () {
            const first = convertLegacyTemporalValue("1995-06-15", "date", "Patient.birthDate");
            const second = convertLegacyTemporalValue(first, "date", "Patient.birthDate");

            expect(second).to.not.equal(first);
            expect(second).to.deep.equal(first);
        });

        it("preserves the legacy string lexical value in canonical.value", function () {
            const lexical = "2015-02-07T13:28:17.2300+02:00";
            const canonical = convertLegacyTemporalValue(lexical, "dateTime", "Observation.effectiveDateTime");

            expect(canonical.value).to.equal(lexical);
            expect(convertLegacyTemporalValue(canonical, "dateTime", "Observation.effectiveDateTime").value).to.equal(
                lexical
            );
        });

        it("returns deep-equal results when converting a canonical object twice", function () {
            const canonical = convertLegacyTemporalValue("1995-06", "date", "Patient.birthDate");
            const converted = convertLegacyTemporalValue(canonical, "date", "Patient.birthDate");
            const convertedAgain = convertLegacyTemporalValue(converted, "date", "Patient.birthDate");

            expect(converted).to.deep.equal(canonical);
            expect(convertedAgain).to.deep.equal(canonical);
        });

        it("preserves Decimal128 identity types on repeated canonical conversion", function () {
            const canonical = convertLegacyBsonDate(
                new Date("2020-01-15T00:00:00.001Z"),
                "instant",
                "Patient.meta.lastUpdated"
            );
            const converted = convertLegacyTemporalValue(canonical, "instant", "Patient.meta.lastUpdated");
            const convertedAgain = convertLegacyTemporalValue(converted, "instant", "Patient.meta.lastUpdated");

            expect(converted.epochSeconds).to.be.instanceOf(mongoose.Types.Decimal128);
            expect(convertedAgain.epochSeconds).to.be.instanceOf(mongoose.Types.Decimal128);
            expect(convertedAgain.epochSeconds.toString()).to.equal(canonical.epochSeconds.toString());
            expect(convertedAgain).to.deep.equal(canonical);
        });
    });

    it("keeps canonical values idempotent without rewrapping them", function () {
        const canonical = convertLegacyBsonDate(
            new Date("2020-01-15T00:00:00.001Z"),
            "instant"
        );
        const converted = convertLegacyTemporalValue(canonical, "instant");

        expect(converted).to.not.equal(canonical);
        expect(converted).to.deep.equal(canonical);
        expect(converted.epochSeconds).to.be.instanceOf(mongoose.Types.Decimal128);
    });

    it("reports the input path for invalid legacy values", function () {
        expect(() =>
            convertLegacyTemporalValue("not-a-date", "date", "Patient.birthDate")
        ).to.throw(/Invalid FHIR date value/);
        expect(() =>
            convertLegacyTemporalValue(
                "2020-02-30T12:00:00Z",
                "dateTime",
                "Patient.deceasedDateTime"
            )
        ).to.throw(/Invalid FHIR dateTime calendar date/);

        try {
            convertLegacyTemporalValue("not-an-instant", "instant", [
                "Patient",
                "recorded"
            ]);
            expect.fail("expected conversion to fail");
        } catch (error) {
            expect(error).to.have.property("path").that.deep.equals([
                "Patient",
                "recorded"
            ]);
        }
    });

    it("rejects non-string legacy values", function () {
        expect(() =>
            convertLegacyTemporalValue({ value: "1995" }, "date", "birthDate")
        ).to.throw(/must be a string/);
    });
});
