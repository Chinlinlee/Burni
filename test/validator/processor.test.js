const { expect } = require("chai");
const {
    validateResource,
    setFetch,
    mapOperationOutcome
} = require("@root/utils/validator/processor");

describe("remote validator processor", () => {
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

    describe("OperationOutcome mapping", () => {
        it("maps error or fatal issues to 422 and returns the validator OperationOutcome", async () => {
            const validatorOutcome = {
                resourceType: "OperationOutcome",
                issue: [{ severity: "error", code: "invalid", diagnostics: "bad field" }]
            };

            setFetch(async () => ({
                json: async () => validatorOutcome
            }));

            const result = await validateResource({ resourceType: "Patient" });

            expect(result.code).to.equal(422);
            expect(result.operationOutcome).to.deep.equal(validatorOutcome);
        });

        it("maps warning or information issues to 200 and returns the validator OperationOutcome", async () => {
            const validatorOutcome = {
                resourceType: "OperationOutcome",
                issue: [{ severity: "warning", code: "business-rule", diagnostics: "minor issue" }]
            };

            setFetch(async () => ({
                json: async () => validatorOutcome
            }));

            const result = await validateResource({ resourceType: "Patient" });

            expect(result.code).to.equal(200);
            expect(result.operationOutcome).to.deep.equal(validatorOutcome);
        });

        it("maps fatal issues to 422", () => {
            const result = mapOperationOutcome({
                resourceType: "OperationOutcome",
                issue: [{ severity: "fatal", code: "structure", diagnostics: "fatal issue" }]
            });

            expect(result.code).to.equal(422);
        });
    });

    describe("validator unavailable responses", () => {
        it("returns 503 when the validator request times out", async () => {
            setFetch((_url, options) => new Promise((resolve, reject) => {
                options.signal.addEventListener("abort", () => {
                    const error = new Error("The operation was aborted");
                    error.name = "AbortError";
                    reject(error);
                });
            }));

            const result = await validateResource(
                { resourceType: "Patient" },
                { timeoutMs: 20 }
            );

            expect(result.code).to.equal(503);
            expect(result.operationOutcome.resourceType).to.equal("OperationOutcome");
            expect(result.operationOutcome.issue[0].diagnostics).to.equal("Validator request timed out");
        });

        it("returns 503 when the validator connection fails", async () => {
            setFetch(async () => {
                throw new Error("connect ECONNREFUSED");
            });

            const result = await validateResource({ resourceType: "Patient" });

            expect(result.code).to.equal(503);
            expect(result.operationOutcome.resourceType).to.equal("OperationOutcome");
            expect(result.operationOutcome.issue[0].diagnostics).to.equal("connect ECONNREFUSED");
        });

        it("returns 502 when the response body is not an OperationOutcome", async () => {
            setFetch(async () => ({
                json: async () => ({ resourceType: "Patient", id: "example" })
            }));

            const result = await validateResource({ resourceType: "Patient" });

            expect(result.code).to.equal(502);
            expect(result.operationOutcome.resourceType).to.equal("OperationOutcome");
            expect(result.operationOutcome.issue[0].diagnostics).to.equal(
                "Validator response is not an OperationOutcome"
            );
        });
    });

    describe("validator HTTP request", () => {
        it("adds comma-joined profile query from meta.profile", async () => {
            let requestedUrl;
            const validatorOutcome = {
                resourceType: "OperationOutcome",
                issue: []
            };

            setFetch(async (url, options) => {
                requestedUrl = url;
                expect(options.method).to.equal("POST");
                return { json: async () => validatorOutcome };
            });

            await validateResource({
                resourceType: "Patient",
                meta: {
                    profile: [
                        "http://example.org/fhir/StructureDefinition/patient-a",
                        "http://example.org/fhir/StructureDefinition/patient-b"
                    ]
                }
            });

            const parsedUrl = new URL(requestedUrl);
            expect(parsedUrl.searchParams.get("profile")).to.equal(
                "http://example.org/fhir/StructureDefinition/patient-a,http://example.org/fhir/StructureDefinition/patient-b"
            );
        });

        it("does not add profile query when meta.profile is missing", async () => {
            let requestedUrl;
            const validatorOutcome = {
                resourceType: "OperationOutcome",
                issue: []
            };

            setFetch(async (url) => {
                requestedUrl = url;
                return { json: async () => validatorOutcome };
            });

            await validateResource({ resourceType: "Patient" });

            const parsedUrl = new URL(requestedUrl);
            expect(parsedUrl.searchParams.has("profile")).to.equal(false);
        });

        it("POSTs Parameters body as-is", async () => {
            let requestBody;
            const parametersResource = {
                resourceType: "Parameters",
                parameter: [{ name: "resource", resource: { resourceType: "Patient" } }]
            };
            const validatorOutcome = {
                resourceType: "OperationOutcome",
                issue: []
            };

            setFetch(async (_url, options) => {
                requestBody = JSON.parse(options.body);
                return { json: async () => validatorOutcome };
            });

            await validateResource(parametersResource);

            expect(requestBody).to.deep.equal(parametersResource);
        });
    });
});
