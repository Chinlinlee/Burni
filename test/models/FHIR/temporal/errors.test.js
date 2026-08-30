require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const {
    DATE_PRECISION,
    TEMPORAL_ERROR_CODE,
    TemporalValidationError,
    assertPublicTemporalScalar,
    mapNormalizerError,
    temporalErrorToOperationOutcome,
    temporalErrorToFhirValidationError,
    normalizeDateSafe,
    normalizeDateTimeSafe,
    normalizeInstantSafe,
    normalizeTemporalSafe
} = require("@models/FHIR/temporal");
const { FhirValidationError } = require("@models/FHIR/httpMessage");

function decimal128(value) {
    return mongoose.Types.Decimal128.fromString(String(value));
}

describe("FHIR temporal errors", function () {
    describe("TemporalValidationError", function () {
        it("stores code, diagnostics, and optional path", function () {
            const error = new TemporalValidationError(
                TEMPORAL_ERROR_CODE.INVALID_TEMPORAL_VALUE,
                "Invalid FHIR date value: 1995-13",
                "Patient.birthDate"
            );

            expect(error).to.be.instanceOf(Error);
            expect(error).to.be.instanceOf(TemporalValidationError);
            expect(error.name).to.equal("TemporalValidationError");
            expect(error.code).to.equal(TEMPORAL_ERROR_CODE.INVALID_TEMPORAL_VALUE);
            expect(error.diagnostics).to.equal("Invalid FHIR date value: 1995-13");
            expect(error.path).to.equal("Patient.birthDate");
            expect(error.message).to.equal("Invalid FHIR date value: 1995-13");
        });
    });

    describe("INVALID_TEMPORAL_VALUE", function () {
        it("rejects values that do not match the FHIR pattern", function () {
            expect(() => normalizeDateSafe("1995-13", "birthDate")).to.throw(
                TemporalValidationError,
                /Invalid FHIR date value/
            );

            try {
                normalizeDateSafe("1995-13", "birthDate");
                expect.fail("expected throw");
            } catch (error) {
                expect(error).to.be.instanceOf(TemporalValidationError);
                expect(error.code).to.equal(TEMPORAL_ERROR_CODE.INVALID_TEMPORAL_VALUE);
                expect(error.path).to.equal("birthDate");
            }
        });

        it("rejects non-string public input", function () {
            try {
                normalizeDateTimeSafe(2015, "effectiveDateTime");
                expect.fail("expected throw");
            } catch (error) {
                expect(error.code).to.equal(TEMPORAL_ERROR_CODE.INVALID_TEMPORAL_VALUE);
                expect(error.diagnostics).to.match(/non-empty string/);
            }
        });

        it("still normalizes valid scalar input", function () {
            const result = normalizeDateSafe("1995-06", "birthDate");

            expect(result.precision).to.equal(DATE_PRECISION.MONTH);
            expect(result.value).to.equal("1995-06");
        });
    });

    describe("ILLEGAL_PRECISION", function () {
        it("maps internal precision inconsistency messages from the normalizer", function () {
            const mapped = mapNormalizerError(
                new Error("Unable to infer date precision for value: 1995"),
                "date",
                "1995",
                "birthDate"
            );

            expect(mapped).to.be.instanceOf(TemporalValidationError);
            expect(mapped.code).to.equal(TEMPORAL_ERROR_CODE.ILLEGAL_PRECISION);
            expect(mapped.path).to.equal("birthDate");
        });

        it("maps canonical validation failures to illegal precision", function () {
            const mapped = mapNormalizerError(
                new Error(
                    "Canonical date.precision must match the lexical precision of value"
                ),
                "date",
                "1995-06",
                "birthDate"
            );

            expect(mapped.code).to.equal(TEMPORAL_ERROR_CODE.ILLEGAL_PRECISION);
        });

        it("converts illegal precision errors to FHIR value issues", function () {
            const error = new TemporalValidationError(
                TEMPORAL_ERROR_CODE.ILLEGAL_PRECISION,
                "Canonical date.precision must match the lexical precision of value",
                "birthDate"
            );
            const outcome = temporalErrorToOperationOutcome(error);

            expect(outcome.resourceType).to.equal("OperationOutcome");
            expect(outcome.issue).to.have.length(1);
            expect(outcome.issue[0]).to.deep.include({
                severity: "error",
                code: "value",
                diagnostics:
                    "Canonical date.precision must match the lexical precision of value"
            });
            expect(outcome.issue[0].location).to.deep.equal(["birthDate"]);
        });
    });

    describe("MISSING_INSTANT_TIMEZONE", function () {
        it("rejects instant values without a timezone suffix", function () {
            try {
                normalizeInstantSafe("2015-02-07T13:28:17", "recorded");
                expect.fail("expected throw");
            } catch (error) {
                expect(error).to.be.instanceOf(TemporalValidationError);
                expect(error.code).to.equal(TEMPORAL_ERROR_CODE.MISSING_INSTANT_TIMEZONE);
                expect(error.diagnostics).to.match(/must include a timezone/);
                expect(error.path).to.equal("recorded");
            }
        });

        it("rejects fractional instant values without a timezone suffix", function () {
            try {
                normalizeInstantSafe("2015-02-07T13:28:17.230", "recorded");
                expect.fail("expected throw");
            } catch (error) {
                expect(error.code).to.equal(TEMPORAL_ERROR_CODE.MISSING_INSTANT_TIMEZONE);
            }
        });

        it("still normalizes instant values with timezone", function () {
            const result = normalizeInstantSafe("2015-02-07T13:28:17Z", "recorded");

            expect(result.value).to.equal("2015-02-07T13:28:17Z");
        });
    });

    describe("PERSISTENCE_SHAPED_INPUT", function () {
        it("rejects canonical temporal objects on public input", function () {
            const persistenceShaped = {
                value: "1995-06",
                precision: DATE_PRECISION.MONTH,
                normalizedStart: "1995-06-01",
                normalizedEnd: "1995-07-01"
            };

            expect(() => assertPublicTemporalScalar(persistenceShaped, "date", "birthDate")).to.throw(
                TemporalValidationError,
                /persistence-shaped temporal object/
            );

            try {
                normalizeDateSafe(persistenceShaped, "birthDate");
                expect.fail("expected throw");
            } catch (error) {
                expect(error.code).to.equal(TEMPORAL_ERROR_CODE.PERSISTENCE_SHAPED_INPUT);
                expect(error.path).to.equal("birthDate");
            }
        });

        it("rejects partial persistence-shaped objects without normalized fields", function () {
            const partialObject = {
                value: "2015-02-07T13:28:17Z",
                precision: "second"
            };

            try {
                normalizeInstantSafe(partialObject, "recorded");
                expect.fail("expected throw");
            } catch (error) {
                expect(error.code).to.equal(TEMPORAL_ERROR_CODE.PERSISTENCE_SHAPED_INPUT);
            }
        });

        it("rejects canonical dateTime objects with Decimal128 fields", function () {
            const persistenceShaped = {
                value: "2015-02-09T16:04:15.817Z",
                precision: "fraction",
                fractionDigits: 3,
                normalizedStart: decimal128("1423497855.817"),
                normalizedEnd: decimal128("1423497855.818")
            };

            try {
                normalizeDateTimeSafe(persistenceShaped, "effectiveDateTime");
                expect.fail("expected throw");
            } catch (error) {
                expect(error.code).to.equal(TEMPORAL_ERROR_CODE.PERSISTENCE_SHAPED_INPUT);
            }
        });
    });

    describe("OperationOutcome conversion", function () {
        it("maps persistence-shaped input to invalid issues", function () {
            const error = new TemporalValidationError(
                TEMPORAL_ERROR_CODE.PERSISTENCE_SHAPED_INPUT,
                "FHIR date must be a scalar string, not a persistence-shaped temporal object",
                "birthDate"
            );
            const outcome = temporalErrorToOperationOutcome(error);

            expect(outcome.issue[0].code).to.equal("invalid");
            expect(outcome.issue[0].severity).to.equal("error");
            expect(outcome.issue[0].location).to.deep.equal(["birthDate"]);
        });

        it("wraps temporal errors in FhirValidationError for 422 responses", function () {
            const error = new TemporalValidationError(
                TEMPORAL_ERROR_CODE.INVALID_TEMPORAL_VALUE,
                "Invalid FHIR date value: 1995-13",
                "birthDate"
            );
            const fhirError = temporalErrorToFhirValidationError(error);

            expect(fhirError).to.be.instanceOf(FhirValidationError);
            expect(fhirError.code).to.equal(422);
            expect(fhirError.operationOutcome.resourceType).to.equal("OperationOutcome");
            expect(fhirError.operationOutcome.issue[0].code).to.equal("value");
        });
    });

    describe("normalizeTemporalSafe", function () {
        it("dispatches by temporal type", function () {
            expect(normalizeTemporalSafe("1995-06", "date", "birthDate").precision).to.equal(
                DATE_PRECISION.MONTH
            );
            expect(
                normalizeTemporalSafe("2015-02-07T13:28:17Z", "instant", "recorded").value
            ).to.equal("2015-02-07T13:28:17Z");
        });

        it("rejects unsupported temporal types", function () {
            try {
                normalizeTemporalSafe("1995", "period", "start");
                expect.fail("expected throw");
            } catch (error) {
                expect(error.code).to.equal(TEMPORAL_ERROR_CODE.INVALID_TEMPORAL_VALUE);
            }
        });
    });
});
