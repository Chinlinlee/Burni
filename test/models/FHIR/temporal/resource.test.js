require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const {
    DATE_PRECISION,
    DATETIME_PRECISION,
    INSTANT_PRECISION,
    TEMPORAL_ERROR_CODE,
    TemporalValidationError,
    normalizeResourceTemporals,
    serializeResourceTemporals
} = require("@models/FHIR/temporal");

function decimal128(value) {
    return mongoose.Types.Decimal128.fromString(String(value));
}

describe("normalizeResourceTemporals", function () {
    it("normalizes Patient birthDate year scalar to a canonical date object", function () {
        const result = normalizeResourceTemporals({
            resourceType: "Patient",
            birthDate: "1995"
        });

        expect(result.birthDate).to.deep.equal({
            value: "1995",
            precision: DATE_PRECISION.YEAR,
            normalizedStart: "1995-01-01",
            normalizedEnd: "1996-01-01"
        });
    });

    it("normalizes nested Period start to a canonical dateTime with UTC interval", function () {
        const result = normalizeResourceTemporals({
            resourceType: "Patient",
            contact: [
                {
                    period: {
                        start: "2015-02"
                    }
                }
            ]
        });

        const start = result.contact[0].period.start;
        expect(start.value).to.equal("2015-02");
        expect(start.precision).to.equal(DATETIME_PRECISION.MONTH);
        expect(start.normalizedStart.toString()).to.equal(String(Date.UTC(2015, 1, 1) / 1000));
        expect(start.normalizedEnd.toString()).to.equal(String(Date.UTC(2015, 2, 1) / 1000));
    });

    it("preserves instant offset in the canonical value", function () {
        const instant = "2015-02-07T13:28:17.230+02:00";
        const result = normalizeResourceTemporals({
            resourceType: "Patient",
            meta: {
                lastUpdated: instant
            }
        });

        expect(result.meta.lastUpdated.value).to.equal(instant);
        expect(result.meta.lastUpdated.precision).to.equal(INSTANT_PRECISION.FRACTION);
        expect(result.meta.lastUpdated.fractionDigits).to.equal(3);
        expect(result.meta.lastUpdated.epochSeconds.toString()).to.equal("1423308497.230");
    });

    it("normalizes Specimen collection.collectedDateTime and resolves myCollection alias", function () {
        const collectedDateTime = "2011-05-30T06:15:00Z";
        const fromCollection = normalizeResourceTemporals({
            resourceType: "Specimen",
            collection: { collectedDateTime }
        });
        const fromMyCollection = normalizeResourceTemporals({
            resourceType: "Specimen",
            myCollection: { collectedDateTime }
        });

        for (const result of [fromCollection, fromMyCollection]) {
            const field = result.collection || result.myCollection;
            expect(field.collectedDateTime.value).to.equal(collectedDateTime);
            expect(field.collectedDateTime.precision).to.equal(DATETIME_PRECISION.SECOND);
            expect(field.collectedDateTime.normalizedStart.toString()).to.equal("1306736100");
            expect(field.collectedDateTime.normalizedEnd.toString()).to.equal("1306736101");
        }
    });

    it("normalizes arrays of temporal values and nested Period fields", function () {
        const result = normalizeResourceTemporals({
            resourceType: "Patient",
            identifier: [
                {
                    period: {
                        start: "2015-02",
                        end: "2016-03"
                    }
                }
            ],
            extension: [
                {
                    url: "http://example.org/timing",
                    valueTiming: {
                        event: ["2015-02", "2016-03-01T13:28:17Z"]
                    }
                }
            ]
        });

        expect(result.identifier[0].period.start.value).to.equal("2015-02");
        expect(result.identifier[0].period.end.value).to.equal("2016-03");
        expect(result.extension[0].valueTiming.event[0]).to.include({
            value: "2015-02",
            precision: DATETIME_PRECISION.MONTH
        });
        expect(result.extension[0].valueTiming.event[1].value).to.equal("2016-03-01T13:28:17Z");
        expect(result.extension[0].valueTiming.event[1].precision).to.equal(
            DATETIME_PRECISION.SECOND
        );
    });

    it("recurses contained resources by each item resourceType", function () {
        const result = normalizeResourceTemporals({
            resourceType: "Patient",
            contained: [
                {
                    resourceType: "Observation",
                    status: "final",
                    code: { text: "demo" },
                    issued: "2015-02-07T13:28:17+02:00",
                    effectiveDateTime: "2015-02"
                }
            ]
        });

        expect(result.contained[0].issued.value).to.equal("2015-02-07T13:28:17+02:00");
        expect(result.contained[0].issued.precision).to.equal(INSTANT_PRECISION.SECOND);
        expect(result.contained[0].effectiveDateTime.value).to.equal("2015-02");
        expect(result.contained[0].effectiveDateTime.precision).to.equal(DATETIME_PRECISION.MONTH);
    });

    it("normalizes choice deceasedDateTime typed as inline string in fhir.schema.json", function () {
        const result = normalizeResourceTemporals({
            resourceType: "Patient",
            deceasedDateTime: "2015-02-07T13:28:17Z"
        });

        expect(result.deceasedDateTime.value).to.equal("2015-02-07T13:28:17Z");
        expect(result.deceasedDateTime.precision).to.equal(DATETIME_PRECISION.SECOND);
        expect(result.deceasedDateTime.normalizedStart).to.deep.equal(
            decimal128(String(Date.UTC(2015, 1, 7, 13, 28, 17) / 1000))
        );
    });

    it("normalizes Extension valueDate, valueDateTime, and valueInstant", function () {
        const result = normalizeResourceTemporals({
            resourceType: "Patient",
            extension: [
                { url: "http://example.org/date", valueDate: "1995-06" },
                { url: "http://example.org/dateTime", valueDateTime: "2015-02" },
                {
                    url: "http://example.org/instant",
                    valueInstant: "2015-02-07T13:28:17Z"
                }
            ]
        });

        expect(result.extension[0].valueDate).to.deep.equal({
            value: "1995-06",
            precision: DATE_PRECISION.MONTH,
            normalizedStart: "1995-06-01",
            normalizedEnd: "1995-07-01"
        });
        expect(result.extension[1].valueDateTime.value).to.equal("2015-02");
        expect(result.extension[1].valueDateTime.precision).to.equal(DATETIME_PRECISION.MONTH);
        expect(result.extension[2].valueInstant.value).to.equal("2015-02-07T13:28:17Z");
        expect(result.extension[2].valueInstant.precision).to.equal(INSTANT_PRECISION.SECOND);
    });

    it("skips keys that start with underscore and leaves those values untouched", function () {
        const birthDateExtension = {
            extension: [{ url: "http://example.org/birthDate-source", valueString: "chart" }]
        };
        const lastUpdatedExtension = { id: "lastUpdated-ext" };

        const result = normalizeResourceTemporals({
            resourceType: "Patient",
            birthDate: "1995",
            _birthDate: birthDateExtension,
            meta: {
                lastUpdated: "2015-02-07T13:28:17Z",
                _lastUpdated: lastUpdatedExtension
            },
            contact: [
                {
                    period: {
                        start: "2015-02",
                        _start: { id: "period-start-ext" }
                    }
                }
            ]
        });

        expect(result.birthDate.value).to.equal("1995");
        expect(result._birthDate).to.deep.equal(birthDateExtension);
        expect(result.meta._lastUpdated).to.deep.equal(lastUpdatedExtension);
        expect(result.contact[0].period._start).to.deep.equal({ id: "period-start-ext" });
        expect(typeof result.meta.lastUpdated).to.equal("object");
        expect(result.meta.lastUpdated.value).to.equal("2015-02-07T13:28:17Z");
    });

    it("throws PERSISTENCE_SHAPED_INPUT when a temporal field is already a canonical object", function () {
        try {
            normalizeResourceTemporals({
                resourceType: "Patient",
                birthDate: {
                    value: "1995",
                    precision: DATE_PRECISION.YEAR,
                    normalizedStart: "1995-01-01",
                    normalizedEnd: "1996-01-01"
                }
            });
            expect.fail("expected throw");
        } catch (error) {
            expect(error).to.be.instanceOf(TemporalValidationError);
            expect(error.code).to.equal(TEMPORAL_ERROR_CODE.PERSISTENCE_SHAPED_INPUT);
        }
    });

    it("throws TemporalValidationError for an invalid temporal scalar", function () {
        try {
            normalizeResourceTemporals({
                resourceType: "Patient",
                birthDate: "1995-13"
            });
            expect.fail("expected throw");
        } catch (error) {
            expect(error).to.be.instanceOf(TemporalValidationError);
            expect(error.code).to.equal(TEMPORAL_ERROR_CODE.INVALID_TEMPORAL_VALUE);
        }
    });

    it("leaves missing and undefined temporal fields absent", function () {
        const result = normalizeResourceTemporals({
            resourceType: "Patient",
            gender: "male"
        });

        expect(result).to.not.have.property("birthDate");
        expect(result).to.not.have.property("deceasedDateTime");
        expect(result.gender).to.equal("male");
    });

    it("does not mutate the caller input object", function () {
        const input = {
            resourceType: "Patient",
            birthDate: "1995",
            contact: [{ period: { start: "2015-02" } }]
        };
        const snapshot = JSON.parse(JSON.stringify(input));

        const result = normalizeResourceTemporals(input);

        expect(input).to.deep.equal(snapshot);
        expect(input.birthDate).to.equal("1995");
        expect(result).to.not.equal(input);
        expect(result.birthDate).to.not.equal(input.birthDate);
        expect(result.contact).to.not.equal(input.contact);
    });
});

/**
 * @param {unknown} value
 */
function expectNoCanonicalLeak(value) {
    if (value && typeof value === "object") {
        expect(value).to.not.have.property("precision");
        expect(value).to.not.have.property("normalizedStart");
        expect(value).to.not.have.property("normalizedEnd");
        expect(value).to.not.have.property("epochSeconds");
        expect(value).to.not.have.property("fractionDigits");
    }
}

describe("serializeResourceTemporals", function () {
    it("unwraps a canonical date year object to the original scalar", function () {
        const result = serializeResourceTemporals({
            resourceType: "Patient",
            birthDate: {
                value: "1995",
                precision: DATE_PRECISION.YEAR,
                normalizedStart: "1995-01-01",
                normalizedEnd: "1996-01-01"
            }
        });

        expect(result.birthDate).to.equal("1995");
        expectNoCanonicalLeak(result.birthDate);
    });

    it("preserves dateTime offset and trailing fractional zeros from the original value", function () {
        const lexical = "2015-02-07T13:28:17.230+02:00";
        const result = serializeResourceTemporals({
            resourceType: "Patient",
            deceasedDateTime: {
                value: lexical,
                precision: DATETIME_PRECISION.FRACTION,
                fractionDigits: 3,
                normalizedStart: decimal128("1423308497.230"),
                normalizedEnd: decimal128("1423308497.231")
            }
        });

        expect(result.deceasedDateTime).to.equal(lexical);
        expectNoCanonicalLeak(result.deceasedDateTime);
    });

    it("preserves a high-precision instant offset from the original value", function () {
        const lexical = "2015-02-07T13:28:17.230456789+02:00";
        const result = serializeResourceTemporals({
            resourceType: "Patient",
            meta: {
                lastUpdated: {
                    value: lexical,
                    precision: INSTANT_PRECISION.FRACTION,
                    fractionDigits: 9,
                    epochSeconds: decimal128("1423308497.230456789")
                }
            }
        });

        expect(result.meta.lastUpdated).to.equal(lexical);
        expectNoCanonicalLeak(result.meta.lastUpdated);
    });

    it("unwraps nested Period start and end", function () {
        const result = serializeResourceTemporals({
            resourceType: "Patient",
            contact: [
                {
                    period: {
                        start: {
                            value: "2015-02",
                            precision: DATETIME_PRECISION.MONTH,
                            normalizedStart: decimal128(String(Date.UTC(2015, 1, 1) / 1000)),
                            normalizedEnd: decimal128(String(Date.UTC(2015, 2, 1) / 1000))
                        },
                        end: {
                            value: "2016-03-01T13:28:17Z",
                            precision: DATETIME_PRECISION.SECOND,
                            normalizedStart: decimal128(String(Date.UTC(2016, 2, 1, 13, 28, 17) / 1000)),
                            normalizedEnd: decimal128(String(Date.UTC(2016, 2, 1, 13, 28, 18) / 1000))
                        }
                    }
                }
            ]
        });

        expect(result.contact[0].period.start).to.equal("2015-02");
        expect(result.contact[0].period.end).to.equal("2016-03-01T13:28:17Z");
        expectNoCanonicalLeak(result.contact[0].period.start);
        expectNoCanonicalLeak(result.contact[0].period.end);
    });

    it("unwraps arrays of temporal values", function () {
        const result = serializeResourceTemporals({
            resourceType: "Patient",
            extension: [
                {
                    url: "http://example.org/timing",
                    valueTiming: {
                        event: [
                            {
                                value: "2015-02",
                                precision: DATETIME_PRECISION.MONTH,
                                normalizedStart: decimal128(String(Date.UTC(2015, 1, 1) / 1000)),
                                normalizedEnd: decimal128(String(Date.UTC(2015, 2, 1) / 1000))
                            },
                            {
                                value: "2016-03-01T13:28:17Z",
                                precision: DATETIME_PRECISION.SECOND,
                                normalizedStart: decimal128(
                                    String(Date.UTC(2016, 2, 1, 13, 28, 17) / 1000)
                                ),
                                normalizedEnd: decimal128(
                                    String(Date.UTC(2016, 2, 1, 13, 28, 18) / 1000)
                                )
                            }
                        ]
                    }
                }
            ]
        });

        expect(result.extension[0].valueTiming.event).to.deep.equal([
            "2015-02",
            "2016-03-01T13:28:17Z"
        ]);
    });

    it("recurses contained Observation effectiveDateTime", function () {
        const lexical = "2015-02-07T13:28:17+02:00";
        const result = serializeResourceTemporals({
            resourceType: "Patient",
            contained: [
                {
                    resourceType: "Observation",
                    status: "final",
                    code: { text: "x" },
                    effectiveDateTime: {
                        value: lexical,
                        precision: DATETIME_PRECISION.SECOND,
                        normalizedStart: decimal128(String(Date.UTC(2015, 1, 7, 11, 28, 17) / 1000)),
                        normalizedEnd: decimal128(String(Date.UTC(2015, 1, 7, 11, 28, 18) / 1000))
                    }
                }
            ]
        });

        expect(result.contained[0].effectiveDateTime).to.equal(lexical);
        expectNoCanonicalLeak(result.contained[0].effectiveDateTime);
    });

    it("unwraps choice deceasedDateTime", function () {
        const lexical = "2015-02-07T13:28:17Z";
        const result = serializeResourceTemporals({
            resourceType: "Patient",
            deceasedDateTime: {
                value: lexical,
                precision: DATETIME_PRECISION.SECOND,
                normalizedStart: decimal128(String(Date.UTC(2015, 1, 7, 13, 28, 17) / 1000)),
                normalizedEnd: decimal128(String(Date.UTC(2015, 1, 7, 13, 28, 18) / 1000))
            }
        });

        expect(result.deceasedDateTime).to.equal(lexical);
        expectNoCanonicalLeak(result.deceasedDateTime);
    });

    it("leaves _birthDate and _start untouched even when they look like objects", function () {
        const birthDateExtension = {
            extension: [{ url: "http://example.org/birthDate-source", valueString: "chart" }]
        };
        const periodStartExtension = {
            value: "1995",
            precision: DATE_PRECISION.YEAR,
            normalizedStart: "1995-01-01",
            normalizedEnd: "1996-01-01"
        };

        const result = serializeResourceTemporals({
            resourceType: "Patient",
            birthDate: {
                value: "1995",
                precision: DATE_PRECISION.YEAR,
                normalizedStart: "1995-01-01",
                normalizedEnd: "1996-01-01"
            },
            _birthDate: birthDateExtension,
            contact: [
                {
                    period: {
                        start: {
                            value: "2015-02",
                            precision: DATETIME_PRECISION.MONTH,
                            normalizedStart: decimal128(String(Date.UTC(2015, 1, 1) / 1000)),
                            normalizedEnd: decimal128(String(Date.UTC(2015, 2, 1) / 1000))
                        },
                        _start: periodStartExtension
                    }
                }
            ]
        });

        expect(result.birthDate).to.equal("1995");
        expect(result._birthDate).to.deep.equal(birthDateExtension);
        expect(result.contact[0].period._start).to.deep.equal(periodStartExtension);
    });

    it("does not emit precision or normalized fields on temporal primitives", function () {
        const result = serializeResourceTemporals({
            resourceType: "Patient",
            birthDate: {
                value: "1995",
                precision: DATE_PRECISION.YEAR,
                normalizedStart: "1995-01-01",
                normalizedEnd: "1996-01-01"
            },
            deceasedDateTime: {
                value: "2015-02-07T13:28:17.230+02:00",
                precision: DATETIME_PRECISION.FRACTION,
                fractionDigits: 3,
                normalizedStart: decimal128("1423308497.230"),
                normalizedEnd: decimal128("1423308497.231")
            }
        });

        expect(JSON.stringify(result)).to.not.include("precision");
        expect(JSON.stringify(result)).to.not.include("normalizedStart");
        expect(JSON.stringify(result)).to.not.include("normalizedEnd");
        expect(JSON.stringify(result)).to.not.include("epochSeconds");
        expect(JSON.stringify(result)).to.not.include("fractionDigits");
    });

    it("leaves already-serialized scalar strings unchanged", function () {
        const input = {
            resourceType: "Patient",
            birthDate: "1995",
            deceasedDateTime: "2015-02-07T13:28:17.230+02:00",
            meta: {
                lastUpdated: "2015-02-07T13:28:17.230Z"
            }
        };

        const result = serializeResourceTemporals(input);

        expect(result.birthDate).to.equal("1995");
        expect(result.deceasedDateTime).to.equal("2015-02-07T13:28:17.230+02:00");
        expect(result.meta.lastUpdated).to.equal("2015-02-07T13:28:17.230Z");
    });

    it("unwraps .value when mongoose extra keys make isCanonicalTemporalObject fail", function () {
        const result = serializeResourceTemporals({
            resourceType: "Patient",
            birthDate: {
                value: "1995",
                precision: DATE_PRECISION.YEAR,
                normalizedStart: "1995-01-01",
                normalizedEnd: "1996-01-01",
                id: undefined
            },
            deceasedDateTime: {
                value: "2015-02-07T13:28:17.230+02:00",
                precision: DATETIME_PRECISION.FRACTION,
                fractionDigits: 3,
                normalizedStart: decimal128("1423308497.230"),
                normalizedEnd: decimal128("1423308497.231"),
                $__: { active: true }
            }
        });

        expect(result.birthDate).to.equal("1995");
        expect(result.deceasedDateTime).to.equal("2015-02-07T13:28:17.230+02:00");
    });

    it("does not mutate the caller input object", function () {
        const input = {
            resourceType: "Patient",
            birthDate: {
                value: "1995",
                precision: DATE_PRECISION.YEAR,
                normalizedStart: "1995-01-01",
                normalizedEnd: "1996-01-01"
            }
        };
        const snapshot = JSON.parse(JSON.stringify(input));

        const result = serializeResourceTemporals(input);

        expect(input).to.deep.equal(snapshot);
        expect(result).to.not.equal(input);
        expect(result.birthDate).to.equal("1995");
    });
});
