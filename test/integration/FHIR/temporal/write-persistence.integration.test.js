require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const {
    DATE_PRECISION,
    DATETIME_PRECISION
} = require("@models/FHIR/temporal");
const { createFakeRequest, createFakeResponse } = require("../../../support/fake-http");
const {
    startFhirCrudTestContext,
    stopFhirCrudTestContext
} = require("../../../support/fhir/crud-test-context");
const { ensureResourceModel } = require("../../../support/fhir/fhir-service");

/**
 * @param {object} body
 */
function createPatientViaCreateService(body) {
    ensureResourceModel("Patient");
    const { CreateService } = require("@root/api/FHIRApiService/services/create.service");
    const req = createFakeRequest({ body, originalUrl: "/Patient" });
    const res = createFakeResponse();
    return new CreateService(req, res, "Patient").create();
}

/**
 * @param {string} id
 * @param {object} body
 */
function updatePatientViaUpdateService(id, body) {
    ensureResourceModel("Patient");
    const { UpdateService } = require("@root/api/FHIRApiService/services/update.service");
    const req = createFakeRequest({
        body,
        params: { id },
        originalUrl: `/Patient/${id}`
    });
    const res = createFakeResponse();
    return new UpdateService(req, res, "Patient").update();
}

describe("FHIR temporal write persistence", function () {
    before(async function () {
        this.timeout(120000);
        await startFhirCrudTestContext();
        ensureResourceModel("Patient");
    });

    after(async function () {
        await stopFhirCrudTestContext();
    });

    beforeEach(async function () {
        await mongoose.model("Patient").deleteMany({});
    });

    it("stores Patient birthDate and deceasedDateTime as canonical objects on create", async function () {
        const created = await createPatientViaCreateService({
            resourceType: "Patient",
            gender: "male",
            birthDate: "1995",
            deceasedDateTime: "2015-02-07T13:28:17Z"
        });

        expect(created.status, JSON.stringify(created.result)).to.equal(true);
        expect(created.result.id).to.be.a("string").and.not.empty;

        const stored = await mongoose.model("Patient").findOne({ id: created.result.id }).lean();
        expect(stored).to.not.equal(null);
        expect(stored.birthDate).to.not.equal("1995");
        expect(stored.birthDate).to.deep.include({
            value: "1995",
            precision: DATE_PRECISION.YEAR,
            normalizedStart: "1995-01-01",
            normalizedEnd: "1996-01-01"
        });
        expect(stored.deceasedDateTime.value).to.equal("2015-02-07T13:28:17Z");
        expect(stored.deceasedDateTime.precision).to.equal(DATETIME_PRECISION.SECOND);
        expect(stored.meta.lastUpdated).to.be.an("object");
        expect(stored.meta.lastUpdated.value).to.be.a("string");
        expect(stored.meta.lastUpdated.epochSeconds).to.exist;
    });

    it("stores an updated birthDate scalar as a canonical date object", async function () {
        const created = await createPatientViaCreateService({
            resourceType: "Patient",
            gender: "female",
            birthDate: "1995"
        });
        expect(created.status, JSON.stringify(created.result)).to.equal(true);

        const updated = await updatePatientViaUpdateService(created.result.id, {
            resourceType: "Patient",
            gender: "female",
            birthDate: "1995-06"
        });
        expect(updated.status).to.equal(true);

        const stored = await mongoose.model("Patient").findOne({ id: created.result.id }).lean();
        expect(stored.birthDate).to.deep.include({
            value: "1995-06",
            precision: DATE_PRECISION.MONTH,
            normalizedStart: "1995-06-01",
            normalizedEnd: "1995-07-01"
        });
        expect(stored.meta.lastUpdated).to.be.an("object");
        expect(stored.meta.lastUpdated.value).to.be.a("string");
    });

    it("rejects persistence-shaped birthDate on create with OperationOutcome", async function () {
        const created = await createPatientViaCreateService({
            resourceType: "Patient",
            gender: "male",
            birthDate: {
                value: "1995",
                precision: DATE_PRECISION.YEAR,
                normalizedStart: "1995-01-01",
                normalizedEnd: "1996-01-01"
            }
        });

        expect(created.status).to.equal(false);
        expect(created.code).to.equal(422);
        expect(created.result).to.be.an("object");
        expect(created.result.resourceType).to.equal("OperationOutcome");
        expect(created.result.issue).to.be.an("array").that.is.not.empty;
        expect(created.result.issue[0].severity).to.equal("error");
        expect(created.result.issue[0].code).to.be.oneOf(["invalid", "value"]);
        expect(created.code).to.not.equal(500);
    });
});
