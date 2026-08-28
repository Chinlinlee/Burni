const { expect } = require("chai");
const {
    validateValidatorConfig,
    parseValidatorTimeoutMs
} = require("@root/utils/validator/config");

describe("validator config", () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
        process.env = originalEnv;
    });

    describe("validateValidatorConfig", () => {
        it("passes when ENABLE_VALIDATOR is not true and VALIDATOR_URL is missing", () => {
            process.env = {
                ...originalEnv,
                ENABLE_VALIDATOR: "false"
            };
            delete process.env.VALIDATOR_URL;

            expect(validateValidatorConfig()).to.deep.equal({ valid: true });
        });

        it("fails when ENABLE_VALIDATOR is true and VALIDATOR_URL is missing", () => {
            process.env = {
                ...originalEnv,
                ENABLE_VALIDATOR: "true"
            };
            delete process.env.VALIDATOR_URL;

            expect(validateValidatorConfig()).to.deep.equal({
                valid: false,
                error: "VALIDATOR_URL is required when ENABLE_VALIDATOR=true"
            });
        });

        it("fails when ENABLE_VALIDATOR is true and VALIDATOR_URL is empty", () => {
            process.env = {
                ...originalEnv,
                ENABLE_VALIDATOR: "true",
                VALIDATOR_URL: "   "
            };

            expect(validateValidatorConfig()).to.deep.equal({
                valid: false,
                error: "VALIDATOR_URL is required when ENABLE_VALIDATOR=true"
            });
        });

        it("fails when VALIDATOR_URL is not an absolute http or https URL", () => {
            process.env = {
                ...originalEnv,
                ENABLE_VALIDATOR: "true",
                VALIDATOR_URL: "/validate"
            };

            expect(validateValidatorConfig()).to.deep.equal({
                valid: false,
                error: "VALIDATOR_URL must be an absolute http or https URL"
            });
        });

        it("passes with a valid http URL and no VALIDATOR_TIMEOUT_MS", () => {
            process.env = {
                ...originalEnv,
                ENABLE_VALIDATOR: "true",
                VALIDATOR_URL: "http://localhost:4567/validate"
            };
            delete process.env.VALIDATOR_TIMEOUT_MS;

            expect(validateValidatorConfig()).to.deep.equal({ valid: true });
        });

        it("fails when VALIDATOR_TIMEOUT_MS is empty", () => {
            process.env = {
                ...originalEnv,
                ENABLE_VALIDATOR: "true",
                VALIDATOR_URL: "http://localhost:4567/validate",
                VALIDATOR_TIMEOUT_MS: ""
            };

            expect(validateValidatorConfig()).to.deep.equal({
                valid: false,
                error: "VALIDATOR_TIMEOUT_MS must be a positive integer"
            });
        });

        it("fails when VALIDATOR_TIMEOUT_MS is zero", () => {
            process.env = {
                ...originalEnv,
                ENABLE_VALIDATOR: "true",
                VALIDATOR_URL: "http://localhost:4567/validate",
                VALIDATOR_TIMEOUT_MS: "0"
            };

            expect(validateValidatorConfig()).to.deep.equal({
                valid: false,
                error: "VALIDATOR_TIMEOUT_MS must be a positive integer"
            });
        });

        it("fails when VALIDATOR_TIMEOUT_MS is not an integer", () => {
            process.env = {
                ...originalEnv,
                ENABLE_VALIDATOR: "true",
                VALIDATOR_URL: "http://localhost:4567/validate",
                VALIDATOR_TIMEOUT_MS: "30.5"
            };

            expect(validateValidatorConfig()).to.deep.equal({
                valid: false,
                error: "VALIDATOR_TIMEOUT_MS must be a positive integer"
            });
        });

        it("passes when VALIDATOR_TIMEOUT_MS is a positive integer", () => {
            process.env = {
                ...originalEnv,
                ENABLE_VALIDATOR: "true",
                VALIDATOR_URL: "http://localhost:4567/validate",
                VALIDATOR_TIMEOUT_MS: "45000"
            };

            expect(validateValidatorConfig()).to.deep.equal({ valid: true });
        });
    });

    describe("parseValidatorTimeoutMs", () => {
        it("defaults to 30000 when unset", () => {
            expect(parseValidatorTimeoutMs(undefined)).to.deep.equal({
                ok: true,
                value: 30000
            });
        });

        it("rejects empty string", () => {
            expect(parseValidatorTimeoutMs("")).to.deep.equal({ ok: false });
        });
    });
});
