require("./setup-env");
const { expect } = require("chai");
const validateHandler = require("@root/api/FHIRApiService/$validate");
const { setFetch } = require("@root/utils/validator/processor");

function createMockResponse() {
    return {
        headers: {
            "content-type": "application/json"
        },
        statusCode: null,
        body: null,
        getHeader(name) {
            return this.headers[name.toLowerCase()];
        },
        status(code) {
            this.statusCode = code;
            return this;
        },
        send(body) {
            this.body = body;
            return this;
        }
    };
}

describe("$validate handler", () => {
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

    it("ignores the profile query parameter when posting to the validator", async () => {
        let requestedUrl;
        const validatorOutcome = {
            resourceType: "OperationOutcome",
            issue: []
        };

        setFetch(async (url) => {
            requestedUrl = url;
            return { json: async () => validatorOutcome };
        });

        const req = {
            body: { resourceType: "Patient" },
            query: {
                profile: "http://example.org/fhir/StructureDefinition/patient"
            }
        };
        const res = createMockResponse();

        await validateHandler(req, res, "Patient");

        expect(res.statusCode).to.equal(200);
        expect(res.body).to.deep.equal(validatorOutcome);
        expect(new URL(requestedUrl).searchParams.has("profile")).to.equal(false);
    });
});
