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

const BIRTH_DATE_YEAR = "1995";
const BIRTH_DATE_MONTH = "1995-06";
const DECEASED_DATE_TIME = "2015-02-07T13:28:17.230+02:00";

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

/**
 * @param {string} id
 */
function readPatientViaReadService(id) {
    ensureResourceModel("Patient");
    const { ReadService } = require("@root/api/FHIRApiService/services/read.service");
    const req = createFakeRequest({
        params: { id },
        originalUrl: `/Patient/${id}`
    });
    const res = createFakeResponse();
    return new ReadService(req, res, "Patient").read();
}

/**
 * @returns {object}
 */
function temporalPatientBody() {
    return {
        resourceType: "Patient",
        gender: "male",
        birthDate: BIRTH_DATE_YEAR,
        deceasedDateTime: DECEASED_DATE_TIME
    };
}

/**
 * @param {object} stored
 * @param {{ birthDateValue: string, birthDatePrecision: string, birthStart: string, birthEnd: string }} expected
 */
function expectCanonicalPatientPersistence(stored, expected) {
    expect(stored).to.not.equal(null);
    expect(stored.birthDate).to.be.an("object");
    expect(stored.birthDate).to.not.equal(expected.birthDateValue);
    expect(stored.birthDate).to.deep.include({
        value: expected.birthDateValue,
        precision: expected.birthDatePrecision,
        normalizedStart: expected.birthStart,
        normalizedEnd: expected.birthEnd
    });
    expect(stored.deceasedDateTime).to.be.an("object");
    expect(stored.deceasedDateTime).to.not.equal(DECEASED_DATE_TIME);
    expect(stored.deceasedDateTime.value).to.equal(DECEASED_DATE_TIME);
    expect(stored.deceasedDateTime.precision).to.equal(DATETIME_PRECISION.FRACTION);
    expect(stored.deceasedDateTime.normalizedStart).to.exist;
    expect(stored.deceasedDateTime.normalizedEnd).to.exist;
    expect(stored.meta.lastUpdated).to.be.an("object");
    expect(stored.meta.lastUpdated).to.not.be.a("string");
    expect(stored.meta.lastUpdated).to.not.be.instanceOf(Date);
    expect(stored.meta.lastUpdated.value).to.be.a("string");
    expect(stored.meta.lastUpdated.precision).to.be.a("string");
    expect(stored.meta.lastUpdated.epochSeconds).to.exist;
}

/**
 * @param {object} resource
 * @param {string} birthDate
 */
function expectPublicTemporalScalars(resource, birthDate) {
    expect(resource.birthDate).to.equal(birthDate);
    expect(resource.birthDate).to.be.a("string");
    expect(resource.deceasedDateTime).to.equal(DECEASED_DATE_TIME);
    expect(resource.deceasedDateTime).to.be.a("string");
    expect(resource).to.not.have.nested.property("birthDate.precision");
    expect(resource).to.not.have.nested.property("deceasedDateTime.precision");
    expect(resource).to.not.have.nested.property("deceasedDateTime.normalizedStart");
    expect(resource.meta.lastUpdated).to.be.a("string");
    expect(resource.meta).to.not.have.nested.property("lastUpdated.precision");
    expect(resource.meta).to.not.have.nested.property("lastUpdated.epochSeconds");
}

describe("FHIR temporal resource round-trip", function () {
    before(async function () {
        this.timeout(120000);
        await startFhirCrudTestContext();
        ensureResourceModel("Patient");
        ensureResourceModel("Patient_history");
    });

    after(async function () {
        await stopFhirCrudTestContext();
    });

    beforeEach(async function () {
        await mongoose.model("Patient").deleteMany({});
        await mongoose.model("Patient_history").deleteMany({});
    });

    it("persists canonical objects in Patient and Patient_history, then round-trips public scalars", async function () {
        const created = await createPatientViaCreateService(temporalPatientBody());

        expect(created.status, JSON.stringify(created.result)).to.equal(true);
        expect(created.code).to.equal(201);
        expectPublicTemporalScalars(created.result, BIRTH_DATE_YEAR);

        const stored = await mongoose.model("Patient").findOne({ id: created.result.id }).lean();
        expectCanonicalPatientPersistence(stored, {
            birthDateValue: BIRTH_DATE_YEAR,
            birthDatePrecision: DATE_PRECISION.YEAR,
            birthStart: "1995-01-01",
            birthEnd: "1996-01-01"
        });

        const storedHistory = await mongoose.model("Patient_history").find({
            id: created.result.id
        }).sort({ "meta.versionId": 1 }).lean();
        expect(storedHistory).to.have.lengthOf(1);
        expectCanonicalPatientPersistence(storedHistory[0], {
            birthDateValue: BIRTH_DATE_YEAR,
            birthDatePrecision: DATE_PRECISION.YEAR,
            birthStart: "1995-01-01",
            birthEnd: "1996-01-01"
        });
        expect(String(storedHistory[0].meta.versionId)).to.equal("1");

        const read = await readPatientViaReadService(created.result.id);
        expect(read.status, JSON.stringify(read.result)).to.equal(true);
        expect(read.code).to.equal(200);
        expectPublicTemporalScalars(read.result, BIRTH_DATE_YEAR);
        expect(read.result.deceasedDateTime).to.equal(DECEASED_DATE_TIME);

        const putBody = JSON.parse(JSON.stringify(read.result));
        const updated = await updatePatientViaUpdateService(created.result.id, putBody);
        expect(updated.status, JSON.stringify(updated.result)).to.equal(true);
        expect(updated.code).to.equal(200);
        expectPublicTemporalScalars(updated.result, BIRTH_DATE_YEAR);
        expect(updated.result.deceasedDateTime).to.equal(DECEASED_DATE_TIME);

        const storedAfterPut = await mongoose.model("Patient").findOne({
            id: created.result.id
        }).lean();
        expectCanonicalPatientPersistence(storedAfterPut, {
            birthDateValue: BIRTH_DATE_YEAR,
            birthDatePrecision: DATE_PRECISION.YEAR,
            birthStart: "1995-01-01",
            birthEnd: "1996-01-01"
        });

        const historyAfterPut = await mongoose.model("Patient_history").find({
            id: created.result.id
        }).sort({ "meta.versionId": 1 }).lean();
        expect(historyAfterPut).to.have.lengthOf(2);
        expectCanonicalPatientPersistence(historyAfterPut[1], {
            birthDateValue: BIRTH_DATE_YEAR,
            birthDatePrecision: DATE_PRECISION.YEAR,
            birthStart: "1995-01-01",
            birthEnd: "1996-01-01"
        });
        expect(String(historyAfterPut[1].meta.versionId)).to.equal("2");

        const secondRead = await readPatientViaReadService(created.result.id);
        expect(secondRead.status, JSON.stringify(secondRead.result)).to.equal(true);
        expectPublicTemporalScalars(secondRead.result, BIRTH_DATE_YEAR);
        expect(secondRead.result.deceasedDateTime).to.equal(DECEASED_DATE_TIME);
    });

    it("stores an updated birthDate scalar as a month-precision canonical object", async function () {
        const created = await createPatientViaCreateService(temporalPatientBody());
        expect(created.status, JSON.stringify(created.result)).to.equal(true);

        const updated = await updatePatientViaUpdateService(created.result.id, {
            resourceType: "Patient",
            gender: "male",
            birthDate: BIRTH_DATE_MONTH,
            deceasedDateTime: DECEASED_DATE_TIME
        });
        expect(updated.status, JSON.stringify(updated.result)).to.equal(true);
        expect(updated.code).to.equal(200);
        expectPublicTemporalScalars(updated.result, BIRTH_DATE_MONTH);

        const stored = await mongoose.model("Patient").findOne({ id: created.result.id }).lean();
        expectCanonicalPatientPersistence(stored, {
            birthDateValue: BIRTH_DATE_MONTH,
            birthDatePrecision: DATE_PRECISION.MONTH,
            birthStart: "1995-06-01",
            birthEnd: "1995-07-01"
        });

        const latestHistory = await mongoose.model("Patient_history").findOne({
            id: created.result.id
        }).sort({ "meta.versionId": -1 }).lean();
        expectCanonicalPatientPersistence(latestHistory, {
            birthDateValue: BIRTH_DATE_MONTH,
            birthDatePrecision: DATE_PRECISION.MONTH,
            birthStart: "1995-06-01",
            birthEnd: "1995-07-01"
        });
    });

    it("rejects persistence-shaped birthDate on update with OperationOutcome and does not persist it", async function () {
        const created = await createPatientViaCreateService(temporalPatientBody());
        expect(created.status, JSON.stringify(created.result)).to.equal(true);

        const updated = await updatePatientViaUpdateService(created.result.id, {
            resourceType: "Patient",
            gender: "male",
            birthDate: {
                value: "2001",
                precision: DATE_PRECISION.YEAR,
                normalizedStart: "2001-01-01",
                normalizedEnd: "2002-01-01"
            },
            deceasedDateTime: DECEASED_DATE_TIME
        });

        expect(updated.status).to.equal(false);
        expect(updated.code).to.equal(422);
        expect(updated.result).to.be.an("object");
        expect(updated.result.resourceType).to.equal("OperationOutcome");
        expect(updated.result.issue).to.be.an("array").that.is.not.empty;
        expect(updated.result.issue[0].severity).to.equal("error");
        expect(updated.result.issue[0].code).to.be.oneOf(["invalid", "value"]);
        expect(updated.code).to.not.equal(500);

        const stored = await mongoose.model("Patient").findOne({ id: created.result.id }).lean();
        expectCanonicalPatientPersistence(stored, {
            birthDateValue: BIRTH_DATE_YEAR,
            birthDatePrecision: DATE_PRECISION.YEAR,
            birthStart: "1995-01-01",
            birthEnd: "1996-01-01"
        });
        expect(stored.birthDate.value).to.not.equal("2001");
    });
});
