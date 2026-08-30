require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const { createFakeRequest, createFakeResponse } = require("../../../support/fake-http");
const {
    startFhirCrudTestContext,
    stopFhirCrudTestContext
} = require("../../../support/fhir/crud-test-context");
const { ensureResourceModel } = require("../../../support/fhir/fhir-service");

const BIRTH_DATE = "1995";
const DECEASED_DATE_TIME = "2015-02-07T13:28:17.230+02:00";
const CONTAINED_EFFECTIVE = "2015-02-07T13:28:17+02:00";

/**
 * @param {object} body
 * @returns {{ service: object, res: ReturnType<typeof createFakeResponse>, create: () => Promise<object> }}
 */
function createPatientViaCreateService(body) {
    ensureResourceModel("Patient");
    const { CreateService } = require("@root/api/FHIRApiService/services/create.service");
    const req = createFakeRequest({ body, originalUrl: "/Patient" });
    const res = createFakeResponse();
    const service = new CreateService(req, res, "Patient");
    return {
        res,
        create: () => service.create()
    };
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
    const service = new ReadService(req, res, "Patient");
    return {
        res,
        read: () => service.read()
    };
}

/**
 * @param {Record<string, string>} query
 */
function searchPatientViaSearchService(query) {
    ensureResourceModel("Patient");
    const { SearchService } = require("@root/api/FHIRApiService/services/search.service");
    const req = createFakeRequest({ query, originalUrl: "/Patient" });
    const res = createFakeResponse();
    const service = new SearchService(req, res, "Patient");
    return {
        res,
        search: () => service.search()
    };
}

/**
 * @param {string} id
 */
function historyPatientViaHistoryService(id) {
    ensureResourceModel("Patient");
    const { HistoryService } = require("@root/api/FHIRApiService/services/history.service");
    const req = createFakeRequest({
        params: { id },
        originalUrl: `/Patient/${id}/_history`
    });
    const res = createFakeResponse();
    const service = new HistoryService(req, res, "Patient");
    return {
        res,
        history: () => service.doHistory()
    };
}

/**
 * @returns {object}
 */
function temporalPatientBody() {
    return {
        resourceType: "Patient",
        gender: "male",
        birthDate: BIRTH_DATE,
        deceasedDateTime: DECEASED_DATE_TIME
    };
}

/**
 * @param {object} resource
 */
function expectPublicTemporalScalars(resource) {
    expect(resource.birthDate).to.equal(BIRTH_DATE);
    expect(resource.birthDate).to.be.a("string");
    expect(resource.deceasedDateTime).to.equal(DECEASED_DATE_TIME);
    expect(resource.deceasedDateTime).to.be.a("string");
    expect(resource).to.not.have.nested.property("birthDate.precision");
    expect(resource).to.not.have.nested.property("deceasedDateTime.precision");
    expect(resource).to.not.have.nested.property("deceasedDateTime.normalizedStart");
    expect(resource.meta.lastUpdated).to.be.a("string");
    expect(resource.meta.lastUpdated).to.match(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
    );
    expect(resource.meta).to.not.have.nested.property("lastUpdated.precision");
    expect(resource.meta).to.not.have.nested.property("lastUpdated.epochSeconds");
}

/**
 * @param {string | undefined} lastModified
 */
function expectValidHttpDate(lastModified) {
    expect(lastModified).to.be.a("string").and.not.empty;
    expect(lastModified).to.not.equal("Invalid Date");
    expect(Number.isNaN(Date.parse(lastModified))).to.equal(false);
}

describe("FHIR temporal response serialization", function () {
    before(async function () {
        this.timeout(120000);
        await startFhirCrudTestContext();
        ensureResourceModel("Patient");
        ensureResourceModel("Observation");
    });

    after(async function () {
        await stopFhirCrudTestContext();
    });

    beforeEach(async function () {
        await mongoose.model("Patient").deleteMany({});
        if (mongoose.models.Patient_history) {
            await mongoose.model("Patient_history").deleteMany({});
        }
    });

    it("returns FHIR scalar temporals on create and read, with a valid Last-Modified header", async function () {
        const createdCall = createPatientViaCreateService(temporalPatientBody());
        const created = await createdCall.create();

        expect(created.status, JSON.stringify(created.result)).to.equal(true);
        expectPublicTemporalScalars(created.result);

        const readCall = readPatientViaReadService(created.result.id);
        const read = await readCall.read();

        expect(read.status, JSON.stringify(read.result)).to.equal(true);
        expect(read.code).to.equal(200);
        expectPublicTemporalScalars(read.result);
        expectValidHttpDate(readCall.res.getState().headers["last-modified"]);
    });

    it("returns FHIR scalar temporals on search bundle entries", async function () {
        const created = await createPatientViaCreateService(temporalPatientBody()).create();
        expect(created.status, JSON.stringify(created.result)).to.equal(true);

        const searched = await searchPatientViaSearchService({ gender: "male" }).search();
        expect(searched.status, JSON.stringify(searched.result)).to.equal(true);
        expect(searched.result.entry).to.be.an("array").that.is.not.empty;

        const match = searched.result.entry.find(
            (entry) => entry.resource && entry.resource.id === created.result.id
        );
        expect(match, "search bundle should include the created Patient").to.exist;
        expectPublicTemporalScalars(match.resource);
    });

    it("returns FHIR scalar temporals on history bundle entries", async function () {
        const created = await createPatientViaCreateService(temporalPatientBody()).create();
        expect(created.status, JSON.stringify(created.result)).to.equal(true);

        const history = await historyPatientViaHistoryService(created.result.id).history();
        expect(history.status, JSON.stringify(history.result)).to.equal(true);
        expect(history.result.entry).to.be.an("array").that.is.not.empty;

        const historyResource = history.result.entry[0].resource;
        expectPublicTemporalScalars(historyResource);

        const storedHistory = await mongoose.model("Patient_history").findOne({
            id: created.result.id
        });
        expect(storedHistory).to.not.equal(null);
        const bundleField = storedHistory.getFHIRBundleField();
        expectPublicTemporalScalars(bundleField);
    });

    it("returns contained Observation effectiveDateTime as a FHIR scalar", async function () {
        const created = await createPatientViaCreateService({
            resourceType: "Patient",
            gender: "female",
            contained: [
                {
                    resourceType: "Observation",
                    status: "final",
                    code: { text: "x" },
                    effectiveDateTime: CONTAINED_EFFECTIVE
                }
            ]
        }).create();

        expect(created.status, JSON.stringify(created.result)).to.equal(true);
        expect(created.result.contained).to.be.an("array").that.is.not.empty;
        expect(created.result.contained[0].effectiveDateTime).to.equal(CONTAINED_EFFECTIVE);
        expect(created.result.contained[0].effectiveDateTime).to.be.a("string");
        expect(created.result.contained[0]).to.not.have.nested.property(
            "effectiveDateTime.precision"
        );

        const read = await readPatientViaReadService(created.result.id).read();
        expect(read.status, JSON.stringify(read.result)).to.equal(true);
        expect(read.result.contained[0].effectiveDateTime).to.equal(CONTAINED_EFFECTIVE);
        expect(read.result.contained[0].effectiveDateTime).to.be.a("string");
        expect(read.result.contained[0]).to.not.have.nested.property("effectiveDateTime.precision");
    });
});
