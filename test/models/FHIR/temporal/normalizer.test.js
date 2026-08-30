require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const {
    DATE_PRECISION,
    DATETIME_PRECISION,
    INSTANT_PRECISION,
    compareDecimal128,
    normalizeDate,
    normalizeDateTime,
    normalizeInstant,
    normalizeTemporal
} = require("@models/FHIR/temporal");

function decimal128(value) {
    return mongoose.Types.Decimal128.fromString(String(value));
}

describe("FHIR temporal normalizer", function () {
    describe("normalizeDate", function () {
        it("normalizes year precision with calendar boundaries", function () {
            const result = normalizeDate("1995");

            expect(result).to.deep.equal({
                value: "1995",
                precision: DATE_PRECISION.YEAR,
                normalizedStart: "1995-01-01",
                normalizedEnd: "1996-01-01"
            });
        });

        it("normalizes month precision with calendar boundaries", function () {
            const result = normalizeDate("1995-06");

            expect(result).to.deep.equal({
                value: "1995-06",
                precision: DATE_PRECISION.MONTH,
                normalizedStart: "1995-06-01",
                normalizedEnd: "1995-07-01"
            });
        });

        it("normalizes day precision with calendar boundaries", function () {
            const result = normalizeDate("1995-06-15");

            expect(result).to.deep.equal({
                value: "1995-06-15",
                precision: DATE_PRECISION.DAY,
                normalizedStart: "1995-06-15",
                normalizedEnd: "1995-06-16"
            });
        });

        it("rejects invalid date input", function () {
            expect(() => normalizeDate("1995-13")).to.throw(/Invalid FHIR date value/);
            expect(() => normalizeDate(1995)).to.throw(/non-empty string/);
        });
    });

    describe("normalizeDateTime", function () {
        it("normalizes month precision to UTC epoch interval", function () {
            const result = normalizeDateTime("2015-02");

            expect(result.value).to.equal("2015-02");
            expect(result.precision).to.equal(DATETIME_PRECISION.MONTH);
            expect(result.normalizedStart.toString()).to.equal(
                String(Date.UTC(2015, 1, 1) / 1000)
            );
            expect(result.normalizedEnd.toString()).to.equal(
                String(Date.UTC(2015, 2, 1) / 1000)
            );
            expect(compareDecimal128(result.normalizedStart, result.normalizedEnd)).to.be.lessThan(
                0
            );
        });

        it("normalizes minute precision without timezone as UTC", function () {
            const result = normalizeDateTime("2015-02-07T13:28");

            expect(result.precision).to.equal(DATETIME_PRECISION.MINUTE);
            expect(result.normalizedStart.toString()).to.equal(
                String(Date.UTC(2015, 1, 7, 13, 28, 0) / 1000)
            );
            expect(result.normalizedEnd.toString()).to.equal(
                String(Date.UTC(2015, 1, 7, 13, 29, 0) / 1000)
            );
        });

        it("normalizes second precision with timezone offset to UTC", function () {
            const result = normalizeDateTime("2015-02-07T13:28:17+02:00");

            expect(result.precision).to.equal(DATETIME_PRECISION.SECOND);
            expect(result.normalizedStart.toString()).to.equal(
                String(Date.UTC(2015, 1, 7, 11, 28, 17) / 1000)
            );
            expect(result.normalizedEnd.toString()).to.equal(
                String(Date.UTC(2015, 1, 7, 11, 28, 18) / 1000)
            );
        });

        it("normalizes fraction precision with trailing zeros preserved in value", function () {
            const result = normalizeDateTime("2015-02-09T16:04:15.817Z");

            expect(result).to.deep.equal({
                value: "2015-02-09T16:04:15.817Z",
                precision: DATETIME_PRECISION.FRACTION,
                fractionDigits: 3,
                normalizedStart: decimal128("1423497855.817"),
                normalizedEnd: decimal128("1423497855.818")
            });
        });

        it("does not use local timezone for timezone-less dateTime", function () {
            const result = normalizeDateTime("2015-02-07T13:28:17");
            const utcEpoch = Date.UTC(2015, 1, 7, 13, 28, 17) / 1000;

            expect(result.normalizedStart.toString()).to.equal(String(utcEpoch));
            expect(result.normalizedStart.toString()).to.not.equal(
                String(Math.floor(new Date(2015, 1, 7, 13, 28, 17).getTime() / 1000))
            );
        });

        it("rejects invalid dateTime input", function () {
            expect(() => normalizeDateTime("2015-02-07T13:28:17")).to.not.throw();
            expect(() => normalizeDateTime("not-a-dateTime")).to.throw(/Invalid FHIR dateTime value/);
        });
    });

    describe("normalizeInstant", function () {
        it("normalizes instant with offset and high-precision fraction", function () {
            const result = normalizeInstant("2015-02-07T13:28:17.230456789+02:00");

            expect(result).to.deep.equal({
                value: "2015-02-07T13:28:17.230456789+02:00",
                precision: INSTANT_PRECISION.FRACTION,
                fractionDigits: 9,
                epochSeconds: decimal128("1423308497.230456789")
            });
        });

        it("normalizes second-precision instant with Z timezone", function () {
            const result = normalizeInstant("2015-02-07T13:28:17Z");

            expect(result.value).to.equal("2015-02-07T13:28:17Z");
            expect(result.precision).to.equal(INSTANT_PRECISION.SECOND);
            expect(result.fractionDigits).to.equal(undefined);
            expect(result.epochSeconds.toString()).to.equal(
                String(Date.UTC(2015, 1, 7, 13, 28, 17) / 1000)
            );
        });

        it("rejects instant without timezone", function () {
            expect(() => normalizeInstant("2015-02-07T13:28:17")).to.throw(
                /Invalid FHIR instant value/
            );
        });
    });

    describe("normalizeTemporal", function () {
        it("dispatches by temporal type", function () {
            expect(normalizeTemporal("1995-06", "date").precision).to.equal(DATE_PRECISION.MONTH);
            expect(normalizeTemporal("2015-02", "dateTime").precision).to.equal(
                DATETIME_PRECISION.MONTH
            );
            expect(normalizeTemporal("2015-02-07T13:28:17Z", "instant").precision).to.equal(
                INSTANT_PRECISION.SECOND
            );
        });

        it("rejects unsupported temporal type", function () {
            expect(() => normalizeTemporal("1995", "period")).to.throw(/Unsupported temporal type/);
        });
    });
});
