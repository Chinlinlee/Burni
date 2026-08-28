require("./setup-env");
const { expect } = require("chai");
const { BaseFhirApiService } = require("@root/api/FHIRApiService/services/base.service");
const { setFetch } = require("@root/utils/validator/processor");

describe("BaseFhirApiService.validateRequestResource", () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        process.env = {
            ...originalEnv,
            ENABLE_VALIDATOR: "true",
            VALIDATOR_URL: "http://localhost:4567/validate"
        };
    });

    afterEach(() => {
        process.env = originalEnv;
        setFetch(require("node-fetch"));
    });

    it("returns status false with 503 when the validator is unreachable", async () => {
        setFetch(async () => {
            throw new Error("connect ECONNREFUSED");
        });

        const result = await BaseFhirApiService.validateRequestResource({
            resourceType: "Patient"
        });

        expect(result.status).to.equal(false);
        expect(result.code).to.equal(503);
        expect(result.result.resourceType).to.equal("OperationOutcome");
    });

    it("returns status false with 502 when the validator body is not an OperationOutcome", async () => {
        setFetch(async () => ({
            json: async () => ({ resourceType: "Patient", id: "example" })
        }));

        const result = await BaseFhirApiService.validateRequestResource({
            resourceType: "Patient"
        });

        expect(result.status).to.equal(false);
        expect(result.code).to.equal(502);
        expect(result.result.resourceType).to.equal("OperationOutcome");
    });
});
