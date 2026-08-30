require("module-alias/register");

const { expect } = require("chai");
const {
    clearResourceCollection,
    createResourceViaService,
    diagnoseResourceModelRegistration,
    readResourceViaService
} = require("../../support/fhir/fhir-service");
const { loadActiveFixture } = require("../../support/fhir/active-fixture");
const {
    startFhirCrudTestContext,
    stopFhirCrudTestContext
} = require("../../support/fhir/crud-test-context");

describe("FHIR generic service support", function () {
    before(async function () {
        this.timeout(120000);
        await startFhirCrudTestContext();
    });

    after(async function () {
        await stopFhirCrudTestContext();
    });

    beforeEach(async function () {
        await clearResourceCollection("Patient");
    });

    it("registers all catalog resource models", function () {
        const diagnosis = diagnoseResourceModelRegistration();
        expect(diagnosis.catalogCount).to.equal(146);
        expect(diagnosis.missingModelFiles, diagnosis.missingModelFiles.join(", ")).to.deep.equal(
            []
        );
        expect(
            diagnosis.registrationFailures.map((entry) => `${entry.resourceType}: ${entry.reason}`),
            diagnosis.registrationFailures.map((entry) => entry.reason).join("; ")
        ).to.deep.equal([]);
        expect(diagnosis.valid).to.equal(true);
    });

    it("creates and reads Patient through the generic adapter", async function () {
        const { resource: fixture } = loadActiveFixture("Patient");
        const created = await createResourceViaService("Patient", fixture);

        expect(created.id).to.be.a("string").and.not.empty;
        expect(created.id).to.not.equal(fixture.id);

        const readResult = await readResourceViaService("Patient", created.id);
        expect(readResult.code).to.equal(200);
        expect(readResult.result.id).to.equal(created.id);
        expect(readResult.result.resourceType).to.equal("Patient");
    });
});
