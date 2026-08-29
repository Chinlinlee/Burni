require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const {
    restoreFhirCrudTestEnv,
    setFhirCrudTestEnv,
    startFhirCrudTestContext,
    stopFhirCrudTestContext
} = require("../../support/fhir/crud-test-context");
const { clearResourceCollection, ensureResourceModel } = require("../../support/fhir/fhir-service");

describe("FHIR CRUD test context", function () {
    /** @type {string | undefined} */
    let originalEnableValidator;

    beforeEach(function () {
        originalEnableValidator = process.env.ENABLE_VALIDATOR;
    });

    afterEach(function () {
        if (originalEnableValidator === undefined) {
            delete process.env.ENABLE_VALIDATOR;
        } else {
            process.env.ENABLE_VALIDATOR = originalEnableValidator;
        }
    });

    it("forces ENABLE_VALIDATOR=false while active and restores the original value", function () {
        process.env.ENABLE_VALIDATOR = "true";
        setFhirCrudTestEnv();
        expect(process.env.ENABLE_VALIDATOR).to.equal("false");

        restoreFhirCrudTestEnv();
        expect(process.env.ENABLE_VALIDATOR).to.equal("true");
    });

    it("deletes ENABLE_VALIDATOR when it was unset before the suite", function () {
        delete process.env.ENABLE_VALIDATOR;
        setFhirCrudTestEnv();
        restoreFhirCrudTestEnv();
        expect(process.env.ENABLE_VALIDATOR).to.equal(undefined);
    });

    it("starts and stops MongoDB memory server lifecycle", async function () {
        this.timeout(120000);
        const context = await startFhirCrudTestContext();
        expect(context.mongoose.connection.readyState).to.equal(1);
        expect(process.env.ENABLE_VALIDATOR).to.equal("false");

        await stopFhirCrudTestContext();
        expect(mongoose.connection.readyState).to.equal(0);
    });

    it("isolates collections per resource type", async function () {
        this.timeout(120000);
        await startFhirCrudTestContext();

        const patientModel = ensureResourceModel("Patient");
        const organizationModel = ensureResourceModel("Organization");
        await patientModel.create({
            resourceType: "Patient",
            id: "patient-isolation-test",
            gender: "unknown"
        });
        await organizationModel.create({
            resourceType: "Organization",
            id: "organization-isolation-test",
            name: "Isolation Org"
        });
        expect(await patientModel.countDocuments({})).to.equal(1);
        expect(await organizationModel.countDocuments({})).to.equal(1);

        await clearResourceCollection("Patient");
        expect(await patientModel.countDocuments({})).to.equal(0);
        expect(await organizationModel.countDocuments({})).to.equal(1);

        await stopFhirCrudTestContext();
    });
});
