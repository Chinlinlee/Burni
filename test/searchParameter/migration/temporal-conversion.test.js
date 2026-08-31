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
    detectLegacyBsonDateAmbiguity
} = require("@models/FHIR/searchParameter/migration/temporalConversion");
const { TEMPORAL_ERROR_CODE } = require("@models/FHIR/temporal");

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

        it("does not infer a calendar date from a BSON Date", function () {
            const legacyDate = new Date("2020-01-15T00:00:00.000Z");
            try {
                convertLegacyBsonDate(legacyDate, "date", "Patient.birthDate", {
                    resource: "Patient",
                    model: "Patient"
                });
                expect.fail("expected conversion to fail");
            } catch (error) {
                expect(error).to.include({
                    code: TEMPORAL_ERROR_CODE.AMBIGUOUS_LEGACY_BSON_DATE,
                    category: "ambiguous-bson-date",
                    temporalType: "date",
                    resource: "Patient",
                    model: "Patient",
                    path: "Patient.birthDate",
                    value: legacyDate
                });
                expect(error.message).to.include("2020-01-15T00:00:00.000Z");
            }
        });

        it("detects date BSON Date ambiguity without using a timezone policy", function () {
            const legacyDate = new Date("2020-01-15T00:00:00.000Z");
            const result = detectLegacyBsonDateAmbiguity(
                legacyDate,
                "date",
                "Patient.birthDate",
                { resource: "Patient", model: "Patient" }
            );

            expect(result).to.include({
                ambiguous: true,
                category: "ambiguous-bson-date",
                code: TEMPORAL_ERROR_CODE.AMBIGUOUS_LEGACY_BSON_DATE,
                temporalType: "date",
                resource: "Patient",
                model: "Patient",
                path: "Patient.birthDate",
                value: legacyDate
            });
        });

        it("does not classify absolute BSON Dates as ambiguous", function () {
            const legacyDate = new Date("2020-01-15T00:00:00.001Z");

            for (const type of ["dateTime", "instant"]) {
                const result = detectLegacyBsonDateAmbiguity(legacyDate, type, "value");

                expect(result.ambiguous).to.equal(false);
                expect(result.category).to.equal("absolute-bson-date");
            }
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
