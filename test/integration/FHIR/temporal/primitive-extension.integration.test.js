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

const BIRTH_DATE = "1995";
const PERIOD_START = "2015-02";
const BIRTH_DATE_EXT_URL = "http://example.org/birthDate-source";
const LAST_UPDATED_EXT_URL = "http://example.org/lastUpdated-source";
const PERIOD_START_EXT_URL = "http://example.org/period-start-source";

const INSTANT_SCALAR_PATTERN =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

/**
 * @returns {object}
 */
function primitiveExtensionPatientBody() {
    return {
        resourceType: "Patient",
        gender: "male",
        birthDate: BIRTH_DATE,
        _birthDate: {
            extension: [{ url: BIRTH_DATE_EXT_URL, valueString: "chart" }]
        },
        meta: {
            _lastUpdated: {
                extension: [{ url: LAST_UPDATED_EXT_URL, valueString: "system" }]
            }
        },
        contact: [
            {
                period: {
                    start: PERIOD_START,
                    _start: {
                        extension: [{ url: PERIOD_START_EXT_URL, valueString: "estimated" }]
                    }
                }
            }
        ]
    };
}

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
 * Element wrappers must stay Element-shaped: never a FHIR temporal scalar
 * and never a canonical temporal object.
 *
 * @param {unknown} value
 * @param {string} label
 */
function expectUntouchedElementMetadata(value, label) {
    expect(value, label).to.be.an("object");
    expect(value, `${label} must not be unwrapped as a temporal scalar`).to.not.be.a("string");
    expect(value).to.have.property("extension").that.is.an("array").that.is.not.empty;
    expect(value).to.not.have.property("precision");
    expect(value).to.not.have.property("normalizedStart");
    expect(value).to.not.have.property("normalizedEnd");
    expect(value).to.not.have.property("epochSeconds");
    expect(value).to.not.have.property("fractionDigits");
}

/**
 * @param {object} resource
 */
function expectPublicTemporalScalars(resource) {
    expect(resource.birthDate).to.equal(BIRTH_DATE);
    expect(resource.birthDate).to.be.a("string");
    expect(resource).to.not.have.nested.property("birthDate.precision");
    expect(resource.contact[0].period.start).to.equal(PERIOD_START);
    expect(resource.contact[0].period.start).to.be.a("string");
    expect(resource.contact[0].period).to.not.have.nested.property("start.precision");
    expect(resource.meta.lastUpdated).to.be.a("string");
    expect(resource.meta.lastUpdated).to.match(INSTANT_SCALAR_PATTERN);
    expect(resource.meta).to.not.have.nested.property("lastUpdated.precision");
    expect(resource.meta).to.not.have.nested.property("lastUpdated.epochSeconds");
}

describe("FHIR primitive extension metadata", function () {
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

    it("does not define resource-level _birthDate on the Patient mongoose schema", function () {
        const patientModule = require("@root/models/mongodb/model/Patient");
        expect(patientModule.schema).to.be.an("object");
        expect(patientModule.schema).to.have.property("birthDate");
        expect(patientModule.schema).to.not.have.property("_birthDate");
        expect(mongoose.model("Patient").schema.path("_birthDate")).to.equal(undefined);
    });

    it("does not treat _-prefixed Element wrappers as temporal on create or read", async function () {
        const createdCall = createPatientViaCreateService(primitiveExtensionPatientBody());
        const created = await createdCall.create();

        expect(created.status, JSON.stringify(created.result)).to.equal(true);
        expect(created.result.id).to.be.a("string").and.not.empty;
        expectPublicTemporalScalars(created.result);
        expect(created.result).to.not.have.property("_birthDate");
        expectUntouchedElementMetadata(created.result.meta._lastUpdated, "create meta._lastUpdated");
        expect(created.result.meta._lastUpdated.extension[0]).to.include({
            url: LAST_UPDATED_EXT_URL,
            valueString: "system"
        });
        expectUntouchedElementMetadata(created.result.contact[0].period._start, "create period._start");
        expect(created.result.contact[0].period._start.extension[0]).to.include({
            url: PERIOD_START_EXT_URL,
            valueString: "estimated"
        });

        const stored = await mongoose.model("Patient").findOne({ id: created.result.id }).lean();
        expect(stored).to.not.equal(null);
        expect(stored).to.not.have.property("_birthDate");
        expect(stored.birthDate).to.deep.include({
            value: BIRTH_DATE,
            precision: DATE_PRECISION.YEAR,
            normalizedStart: "1995-01-01",
            normalizedEnd: "1996-01-01"
        });
        expect(stored.contact[0].period.start.value).to.equal(PERIOD_START);
        expect(stored.contact[0].period.start.precision).to.equal(DATETIME_PRECISION.MONTH);
        expect(stored.meta.lastUpdated).to.be.an("object");
        expect(stored.meta.lastUpdated.value).to.be.a("string");
        expect(stored.meta.lastUpdated.epochSeconds).to.exist;
        expectUntouchedElementMetadata(stored.meta._lastUpdated, "stored meta._lastUpdated");
        expect(stored.meta._lastUpdated.extension[0]).to.include({
            url: LAST_UPDATED_EXT_URL,
            valueString: "system"
        });
        expectUntouchedElementMetadata(stored.contact[0].period._start, "stored period._start");
        expect(stored.contact[0].period._start.extension[0]).to.include({
            url: PERIOD_START_EXT_URL,
            valueString: "estimated"
        });

        const readCall = readPatientViaReadService(created.result.id);
        const read = await readCall.read();

        expect(read.status, JSON.stringify(read.result)).to.equal(true);
        expect(read.code).to.equal(200);
        expectPublicTemporalScalars(read.result);
        expect(read.result).to.not.have.property("_birthDate");
        expectUntouchedElementMetadata(read.result.meta._lastUpdated, "read meta._lastUpdated");
        expect(read.result.meta._lastUpdated.extension[0]).to.include({
            url: LAST_UPDATED_EXT_URL,
            valueString: "system"
        });
        expect(read.result.meta._lastUpdated).to.not.match(INSTANT_SCALAR_PATTERN);
        expectUntouchedElementMetadata(read.result.contact[0].period._start, "read period._start");
        expect(read.result.contact[0].period._start.extension[0]).to.include({
            url: PERIOD_START_EXT_URL,
            valueString: "estimated"
        });
        expect(read.result.contact[0].period._start).to.not.equal(PERIOD_START);
    });
});
