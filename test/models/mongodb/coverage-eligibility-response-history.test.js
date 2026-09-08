require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const { loadActiveFixture } = require("../../support/fhir/active-fixture");
const {
    clearResourceCollection,
    createResourceViaService,
    ensureMongodbConnectorLoaded
} = require("../../support/fhir/fhir-service");
const {
    startFhirCrudTestContext,
    stopFhirCrudTestContext
} = require("../../support/fhir/crud-test-context");
const { createFakeRequest, createFakeResponse } = require("../../support/fake-http");

const RESOURCE_TYPE = "CoverageEligibilityResponse";

describe("CoverageEligibilityResponse history vread", function () {
    this.timeout(120000);

    before(async function () {
        process.env.FHIRSERVER_HOST = process.env.FHIRSERVER_HOST || "localhost";
        process.env.FHIRSERVER_PORT = process.env.FHIRSERVER_PORT || "8080";
        process.env.FHIRSERVER_APIPATH = process.env.FHIRSERVER_APIPATH || "fhir";
        await startFhirCrudTestContext();
        ensureMongodbConnectorLoaded();
    });

    after(async function () {
        await stopFhirCrudTestContext();
    });

    beforeEach(async function () {
        await clearResourceCollection(RESOURCE_TYPE);
        await mongoose.model(`${RESOURCE_TYPE}_history`).deleteMany({});
    });

    it("preserves FHIR request reference in vread after PUT update", async function () {
        const { VReadService } = require("@root/api/FHIRApiService/services/vread.service");
        const { UpdateService } = require("@root/api/FHIRApiService/services/update.service");
        const { resource: fixture } = loadActiveFixture(RESOURCE_TYPE);
        const created = await createResourceViaService(RESOURCE_TYPE, fixture);
        const expectedRequestReference = fixture.request.reference;

        const updateReq = createFakeRequest({
            params: { id: created.id },
            body: {
                ...fixture,
                id: created.id,
                disposition: "Updated disposition after PUT."
            },
            originalUrl: `/${RESOURCE_TYPE}/${created.id}`
        });
        const updateRes = createFakeResponse();
        const updateService = new UpdateService(updateReq, updateRes, RESOURCE_TYPE);
        const updateResult = await updateService.update();
        expect(updateResult.status, JSON.stringify(updateResult.result)).to.equal(true);

        const vreadReq = createFakeRequest({
            params: {
                id: created.id,
                version: "1"
            },
            originalUrl: `/${RESOURCE_TYPE}/${created.id}/_history/1`
        });
        const vreadRes = createFakeResponse();
        const vreadService = new VReadService(
            vreadReq,
            vreadRes,
            RESOURCE_TYPE
        );
        const vreadResult = await vreadService.versionRead();

        expect(vreadResult.status, JSON.stringify(vreadResult.result)).to.equal(true);
        expect(vreadResult.result.request, JSON.stringify(vreadResult.result)).to.deep.equal({
            reference: expectedRequestReference
        });
    });

    it("preserves FHIR request reference in vread version 2 after PUT update", async function () {
        const { VReadService } = require("@root/api/FHIRApiService/services/vread.service");
        const { UpdateService } = require("@root/api/FHIRApiService/services/update.service");
        const { resource: fixture } = loadActiveFixture(RESOURCE_TYPE);
        const created = await createResourceViaService(RESOURCE_TYPE, fixture);
        const expectedRequestReference = fixture.request.reference;

        const updateReq = createFakeRequest({
            params: { id: created.id },
            body: {
                ...fixture,
                id: created.id,
                disposition: "Updated disposition after PUT."
            },
            originalUrl: `/${RESOURCE_TYPE}/${created.id}`
        });
        const updateRes = createFakeResponse();
        const updateService = new UpdateService(updateReq, updateRes, RESOURCE_TYPE);
        const updateResult = await updateService.update();
        expect(updateResult.status, JSON.stringify(updateResult.result)).to.equal(true);

        const vreadReq = createFakeRequest({
            params: {
                id: created.id,
                version: "2"
            },
            originalUrl: `/${RESOURCE_TYPE}/${created.id}/_history/2`
        });
        const vreadRes = createFakeResponse();
        const vreadService = new VReadService(
            vreadReq,
            vreadRes,
            RESOURCE_TYPE
        );
        const vreadResult = await vreadService.versionRead();

        expect(vreadResult.status, JSON.stringify(vreadResult.result)).to.equal(true);
        expect(vreadResult.result.request, JSON.stringify(vreadResult.result)).to.deep.equal({
            reference: expectedRequestReference
        });
    });

    it("returns history bundle with FHIR request on resource and HTTP provenance on entry", async function () {
        const { HistoryService } = require("@root/api/FHIRApiService/services/history.service");
        const { UpdateService } = require("@root/api/FHIRApiService/services/update.service");
        const { resource: fixture } = loadActiveFixture(RESOURCE_TYPE);
        const created = await createResourceViaService(RESOURCE_TYPE, fixture);
        const expectedRequestReference = fixture.request.reference;
        const port =
            process.env.FHIRSERVER_PORT === "80" || process.env.FHIRSERVER_PORT === "443"
                ? ""
                : `:${process.env.FHIRSERVER_PORT}`;

        const updateReq = createFakeRequest({
            params: { id: created.id },
            body: {
                ...fixture,
                id: created.id,
                disposition: "Updated disposition after PUT."
            },
            originalUrl: `/${RESOURCE_TYPE}/${created.id}`
        });
        const updateRes = createFakeResponse();
        const updateService = new UpdateService(updateReq, updateRes, RESOURCE_TYPE);
        const updateResult = await updateService.update();
        expect(updateResult.status, JSON.stringify(updateResult.result)).to.equal(true);

        const historyReq = createFakeRequest({
            params: { id: created.id },
            originalUrl: `/${RESOURCE_TYPE}/${created.id}/_history`
        });
        const historyRes = createFakeResponse();
        const historyService = new HistoryService(historyReq, historyRes, RESOURCE_TYPE);
        const historyResult = await historyService.doHistory();

        expect(historyResult.status, JSON.stringify(historyResult.result)).to.equal(true);
        expect(historyResult.result.entry).to.be.an("array").with.lengthOf(2);

        const version2Entry = historyResult.result.entry.find(
            (entry) => entry.resource.meta.versionId === "2"
        );
        const version1Entry = historyResult.result.entry.find(
            (entry) => entry.resource.meta.versionId === "1"
        );
        expect(version1Entry, JSON.stringify(historyResult.result.entry)).to.exist;
        expect(version2Entry, JSON.stringify(historyResult.result.entry)).to.exist;

        for (const entry of [version1Entry, version2Entry]) {
            expect(entry.resource.request, JSON.stringify(entry.resource)).to.deep.equal({
                reference: expectedRequestReference
            });
            expect(entry.resource).to.not.have.property("bundleRequest");
            expect(entry.resource).to.not.have.property("bundleResponse");
            expect(entry.request).to.have.property("method").that.is.a("string");
            expect(entry.request).to.have.property("url").that.is.a("string");
            expect(entry.response).to.have.property("status").that.is.a("string");
        }

        expect(version1Entry.request.method).to.equal("POST");
        expect(version1Entry.response.status).to.equal("201");
        expect(version1Entry.request.url).to.equal(
            `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/${RESOURCE_TYPE}/${created.id}/_history/1`
        );

        expect(version2Entry.request.method).to.equal("PUT");
        expect(version2Entry.response.status).to.equal("200");
        expect(version2Entry.request.url).to.equal(
            `http://${process.env.FHIRSERVER_HOST}${port}/${process.env.FHIRSERVER_APIPATH}/${RESOURCE_TYPE}/${created.id}/_history/2`
        );
    });
});
