const { expect } = require("chai");
const { throwIfValidationFailed } = require("@root/utils/validator/validation-result");
const {
    FhirValidationError,
    ErrorOperationOutcome
} = require("@models/FHIR/httpMessage");

describe("throwIfValidationFailed", () => {
    it("throws FhirValidationError for 422 validation failures", () => {
        const operationOutcome = {
            resourceType: "OperationOutcome",
            issue: [{ severity: "error", code: "invalid", diagnostics: "bad field" }]
        };

        try {
            throwIfValidationFailed({
                status: false,
                code: 422,
                result: operationOutcome
            });
            expect.fail("expected throw");
        } catch (error) {
            expect(error).to.be.instanceOf(FhirValidationError);
        }
    });

    it("throws ErrorOperationOutcome for 503 validator unavailability", () => {
        const operationOutcome = {
            resourceType: "OperationOutcome",
            issue: [{ severity: "error", code: "exception", diagnostics: "timeout" }]
        };

        try {
            throwIfValidationFailed({
                status: false,
                code: 503,
                result: operationOutcome
            });
            expect.fail("expected throw");
        } catch (error) {
            expect(error).to.be.instanceOf(ErrorOperationOutcome);
            expect(error.code).to.equal(503);
        }
    });

    it("throws ErrorOperationOutcome for 502 validator response errors", () => {
        const operationOutcome = {
            resourceType: "OperationOutcome",
            issue: [{ severity: "error", code: "exception", diagnostics: "bad gateway" }]
        };

        try {
            throwIfValidationFailed({
                status: false,
                code: 502,
                result: operationOutcome
            });
            expect.fail("expected throw");
        } catch (error) {
            expect(error).to.be.instanceOf(ErrorOperationOutcome);
            expect(error.code).to.equal(502);
        }
    });

    it("does not throw when validation succeeded", () => {
        expect(() => throwIfValidationFailed({
            status: true,
            code: 200,
            result: "All OK"
        })).to.not.throw();
    });
});
