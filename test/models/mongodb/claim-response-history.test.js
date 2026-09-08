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

const RESOURCE_TYPE = "ClaimResponse";

describe("ClaimResponse history vread", function () {
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
});
