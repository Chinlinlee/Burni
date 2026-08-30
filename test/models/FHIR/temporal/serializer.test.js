require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const {
    DATE_PRECISION,
    DATETIME_PRECISION,
    INSTANT_PRECISION,
    normalizeDate,
    normalizeDateTime,
    normalizeInstant,
    serializeDate,
    serializeDateTime,
    serializeInstant,
    serializeTemporal,
    isCanonicalTemporalObject
} = require("@models/FHIR/temporal");

function decimal128(value) {
    return mongoose.Types.Decimal128.fromString(String(value));
}

describe("FHIR temporal serializer", function () {
    describe("serializeDate", function () {
        it("returns the value field unchanged from a canonical date object", function () {
            const canonical = {
                value: "1995-06",
                precision: DATE_PRECISION.MONTH,
                normalizedStart: "1995-06-01",
                normalizedEnd: "1995-07-01"
            };

            expect(serializeDate(canonical)).to.equal("1995-06");
        });

        it("round-trips year precision through normalize and serialize", function () {
            const scalar = "1995";
            expect(serializeDate(normalizeDate(scalar))).to.equal(scalar);
        });

        it("round-trips day precision through normalize and serialize", function () {
            const scalar = "2012-01-15";
            expect(serializeDate(normalizeDate(scalar))).to.equal(scalar);
        });

        it("rejects non-canonical input", function () {
            expect(() => serializeDate("1995-06")).to.throw(/not a canonical date object/);
        });
    });

    describe("serializeDateTime", function () {
        it("preserves timezone offset without UTC conversion", function () {
            const canonical = normalizeDateTime("2015-02-07T13:28:17+02:00");

            expect(serializeDateTime(canonical)).to.equal("2015-02-07T13:28:17+02:00");
        });

        it("preserves trailing fractional zeros", function () {
            const canonical = normalizeDateTime("2015-02-07T13:28:17.230+02:00");

            expect(serializeDateTime(canonical)).to.equal("2015-02-07T13:28:17.230+02:00");
        });

        it("preserves minute precision", function () {
            const canonical = normalizeDateTime("2015-02-07T13:28");

            expect(serializeDateTime(canonical)).to.equal("2015-02-07T13:28");
        });

        it("preserves month precision", function () {
            const scalar = "2015-02";
            expect(serializeDateTime(normalizeDateTime(scalar))).to.equal(scalar);
        });

        it("preserves Z timezone and fraction digits", function () {
            const scalar = "2015-02-09T16:04:15.817Z";
            expect(serializeDateTime(normalizeDateTime(scalar))).to.equal(scalar);
        });

        it("returns value field directly from a hand-built canonical object", function () {
            const canonical = {
                value: "2015-02-07T13:28:17.230+02:00",
                precision: DATETIME_PRECISION.FRACTION,
                fractionDigits: 3,
                normalizedStart: decimal128("1423308497.230"),
                normalizedEnd: decimal128("1423308497.231")
            };

            expect(serializeDateTime(canonical)).to.equal("2015-02-07T13:28:17.230+02:00");
        });

        it("rejects non-canonical input", function () {
            expect(() => serializeDateTime("2015-02-07T13:28")).to.throw(
                /not a canonical dateTime object/
            );
        });
    });

    describe("serializeInstant", function () {
        it("preserves offset and high-precision fraction", function () {
            const scalar = "2015-02-07T13:28:17.230456789+02:00";
            expect(serializeInstant(normalizeInstant(scalar))).to.equal(scalar);
        });

        it("preserves second-precision Z instant", function () {
            const scalar = "2015-02-07T13:28:17Z";
            expect(serializeInstant(normalizeInstant(scalar))).to.equal(scalar);
        });

        it("returns value field directly from a hand-built canonical object", function () {
            const canonical = {
                value: "2015-02-07T13:28:17.230+02:00",
                precision: INSTANT_PRECISION.FRACTION,
                fractionDigits: 3,
                epochSeconds: decimal128("1423308497.230")
            };

            expect(serializeInstant(canonical)).to.equal("2015-02-07T13:28:17.230+02:00");
        });

        it("rejects non-canonical input", function () {
            expect(() => serializeInstant("2015-02-07T13:28:17Z")).to.throw(
                /not a canonical instant object/
            );
        });
    });

    describe("serializeTemporal", function () {
        it("dispatches by temporal type", function () {
            expect(serializeTemporal(normalizeDate("1995"), "date")).to.equal("1995");
            expect(serializeTemporal(normalizeDateTime("2015-02"), "dateTime")).to.equal("2015-02");
            expect(serializeTemporal(normalizeInstant("2015-02-07T13:28:17Z"), "instant")).to.equal(
                "2015-02-07T13:28:17Z"
            );
        });

        it("rejects unsupported temporal type", function () {
            expect(() => serializeTemporal(normalizeDate("1995"), "period")).to.throw(
                /Unsupported temporal type/
            );
        });
    });

    describe("isCanonicalTemporalObject", function () {
        it("detects canonical date objects", function () {
            expect(
                isCanonicalTemporalObject(
                    {
                        value: "1995-06",
                        precision: DATE_PRECISION.MONTH,
                        normalizedStart: "1995-06-01",
                        normalizedEnd: "1995-07-01"
                    },
                    "date"
                )
            ).to.be.true;
        });

        it("detects canonical dateTime objects", function () {
            expect(
                isCanonicalTemporalObject(
                    {
                        value: "2015-02-07T13:28:17.230+02:00",
                        precision: DATETIME_PRECISION.FRACTION,
                        fractionDigits: 3,
                        normalizedStart: decimal128("1423308497.230"),
                        normalizedEnd: decimal128("1423308497.231")
                    },
                    "dateTime"
                )
            ).to.be.true;
        });

        it("detects canonical instant objects", function () {
            expect(
                isCanonicalTemporalObject(
                    {
                        value: "2015-02-07T13:28:17Z",
                        precision: INSTANT_PRECISION.SECOND,
                        epochSeconds: decimal128("1423308497")
                    },
                    "instant"
                )
            ).to.be.true;
        });

        it("rejects FHIR scalar strings", function () {
            expect(isCanonicalTemporalObject("2015-02-07T13:28:17Z", "instant")).to.be.false;
            expect(isCanonicalTemporalObject("1995-06", "date")).to.be.false;
        });

        it("rejects objects with unexpected fields", function () {
            expect(
                isCanonicalTemporalObject(
                    {
                        value: "1995-06",
                        precision: DATE_PRECISION.MONTH,
                        normalizedStart: "1995-06-01",
                        normalizedEnd: "1995-07-01",
                        extra: true
                    },
                    "date"
                )
            ).to.be.false;
        });

        it("rejects objects with wrong normalized field types", function () {
            expect(
                isCanonicalTemporalObject(
                    {
                        value: "2015-02-07T13:28:17Z",
                        precision: INSTANT_PRECISION.SECOND,
                        epochSeconds: "1423308497"
                    },
                    "instant"
                )
            ).to.be.false;
        });
    });
});
