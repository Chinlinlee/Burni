require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const {
    DATE_PRECISION,
    DATETIME_PRECISION,
    INSTANT_PRECISION
} = require("@models/FHIR/temporal");
const { createFakeRequest, createFakeResponse } = require("../../../support/fake-http");
const {
    startFhirCrudTestContext,
    stopFhirCrudTestContext
} = require("../../../support/fhir/crud-test-context");
const { ensureResourceModel } = require("../../../support/fhir/fhir-service");

/** @typedef {{ resourceType: string, field: string, scalar: string, body: object, searchQuery: Record<string, string>, precision: string, fractionDigits?: number }} LexicalFixture */

const DATE_CASES = [
    {
        label: "year precision",
        scalar: "1995",
        precision: DATE_PRECISION.YEAR
    },
    {
        label: "month precision",
        scalar: "1995-06",
        precision: DATE_PRECISION.MONTH
    },
    {
        label: "day precision",
        scalar: "2012-01-15",
        precision: DATE_PRECISION.DAY
    }
];

const DATETIME_CASES = [
    {
        label: "minute precision without timezone",
        scalar: "2015-02-07T13:28",
        precision: DATETIME_PRECISION.MINUTE
    },
    {
        label: "second precision with +02:00 offset",
        scalar: "2015-02-07T13:28:17+02:00",
        precision: DATETIME_PRECISION.SECOND
    },
    {
        label: "fraction with +02:00 offset",
        scalar: "2015-02-07T13:28:17.230+02:00",
        precision: DATETIME_PRECISION.FRACTION,
        fractionDigits: 3
    },
    {
        label: "fraction with trailing zeros and +02:00 offset",
        scalar: "2015-02-07T13:28:17.2300+02:00",
        precision: DATETIME_PRECISION.FRACTION,
        fractionDigits: 4
    }
];

const INSTANT_CASES = [
    {
        label: "high-precision fraction with +02:00 offset",
        scalar: "2015-02-07T13:28:17.230456789+02:00",
        precision: INSTANT_PRECISION.FRACTION,
        fractionDigits: 9
    },
    {
        label: "second precision with Z timezone",
        scalar: "2015-02-07T13:28:17Z",
        precision: INSTANT_PRECISION.SECOND
    }
];

/**
 * @param {string} resourceType
 * @param {object} body
 */
function createResourceViaCreateService(resourceType, body) {
    ensureResourceModel(resourceType);
    const { CreateService } = require("@root/api/FHIRApiService/services/create.service");
    const req = createFakeRequest({ body, originalUrl: `/${resourceType}` });
    const res = createFakeResponse();
    return new CreateService(req, res, resourceType).create();
}

/**
 * @param {string} resourceType
 * @param {string} id
 */
function readResourceViaReadService(resourceType, id) {
    ensureResourceModel(resourceType);
    const { ReadService } = require("@root/api/FHIRApiService/services/read.service");
    const req = createFakeRequest({
        params: { id },
        originalUrl: `/${resourceType}/${id}`
    });
    const res = createFakeResponse();
    return new ReadService(req, res, resourceType).read();
}

/**
 * @param {string} resourceType
 * @param {Record<string, string>} query
 */
function searchResourceViaSearchService(resourceType, query) {
    ensureResourceModel(resourceType);
    const { SearchService } = require("@root/api/FHIRApiService/services/search.service");
    const req = createFakeRequest({ query, originalUrl: `/${resourceType}` });
    const res = createFakeResponse();
    return new SearchService(req, res, resourceType).search();
}

/**
 * @param {string} resourceType
 * @param {string} id
 */
function historyResourceViaHistoryService(resourceType, id) {
    ensureResourceModel(resourceType);
    const { HistoryService } = require("@root/api/FHIRApiService/services/history.service");
    const req = createFakeRequest({
        params: { id },
        originalUrl: `/${resourceType}/${id}/_history`
    });
    const res = createFakeResponse();
    return new HistoryService(req, res, resourceType).doHistory();
}

/**
 * @param {object} resource
 * @param {string} field
 * @param {string} scalar
 */
function expectExactLexicalScalar(resource, field, scalar) {
    expect(resource[field]).to.equal(scalar);
    expect(resource[field]).to.be.a("string");
    expect(resource).to.not.have.nested.property(`${field}.precision`);
    expect(resource).to.not.have.nested.property(`${field}.normalizedStart`);
    expect(resource).to.not.have.nested.property(`${field}.epochSeconds`);
}

/**
 * @param {object | undefined} stored
 * @param {string} field
 * @param {string} scalar
 * @param {string} precision
 * @param {number | undefined} fractionDigits
 */
function expectCanonicalDiffersFromPublicScalar(stored, field, scalar, precision, fractionDigits) {
    expect(stored).to.not.equal(null);
    expect(stored[field]).to.be.an("object");
    expect(stored[field]).to.not.equal(scalar);
    expect(stored[field].value).to.equal(scalar);
    expect(stored[field].precision).to.equal(precision);
    if (fractionDigits === undefined) {
        expect(stored[field]).to.not.have.property("fractionDigits");
    } else {
        expect(stored[field].fractionDigits).to.equal(fractionDigits);
    }
}

/**
 * @param {LexicalFixture} fixture
 */
async function assertLexicalRoundTrip(fixture) {
    const created = await createResourceViaCreateService(fixture.resourceType, fixture.body);
    expect(created.status, JSON.stringify(created.result)).to.equal(true);
    expect(created.code).to.equal(201);
    expectExactLexicalScalar(created.result, fixture.field, fixture.scalar);

    const stored = await mongoose
        .model(fixture.resourceType)
        .findOne({ id: created.result.id })
        .lean();
    expectCanonicalDiffersFromPublicScalar(
        stored,
        fixture.field,
        fixture.scalar,
        fixture.precision,
        fixture.fractionDigits
    );

    const read = await readResourceViaReadService(fixture.resourceType, created.result.id);
    expect(read.status, JSON.stringify(read.result)).to.equal(true);
    expect(read.code).to.equal(200);
    expectExactLexicalScalar(read.result, fixture.field, fixture.scalar);

    const searched = await searchResourceViaSearchService(fixture.resourceType, fixture.searchQuery);
    expect(searched.status, JSON.stringify(searched.result)).to.equal(true);
    expect(searched.result.entry).to.be.an("array").that.is.not.empty;
    const searchMatch = searched.result.entry.find(
        (entry) => entry.resource && entry.resource.id === created.result.id
    );
    expect(searchMatch, "search bundle should include the created resource").to.exist;
    expectExactLexicalScalar(searchMatch.resource, fixture.field, fixture.scalar);

    const history = await historyResourceViaHistoryService(fixture.resourceType, created.result.id);
    expect(history.status, JSON.stringify(history.result)).to.equal(true);
    expect(history.result.entry).to.be.an("array").that.is.not.empty;
    const historyResource = history.result.entry[0].resource;
    expectExactLexicalScalar(historyResource, fixture.field, fixture.scalar);

    const storedHistory = await mongoose
        .model(`${fixture.resourceType}_history`)
        .findOne({ id: created.result.id })
        .lean();
    expectCanonicalDiffersFromPublicScalar(
        storedHistory,
        fixture.field,
        fixture.scalar,
        fixture.precision,
        fixture.fractionDigits
    );
}

describe("FHIR temporal lexical round-trip", function () {
    before(async function () {
        this.timeout(120000);
        await startFhirCrudTestContext();
        ensureResourceModel("Patient");
        ensureResourceModel("Patient_history");
        ensureResourceModel("Observation");
        ensureResourceModel("Observation_history");
    });

    after(async function () {
        await stopFhirCrudTestContext();
    });

    beforeEach(async function () {
        await mongoose.model("Patient").deleteMany({});
        await mongoose.model("Patient_history").deleteMany({});
        await mongoose.model("Observation").deleteMany({});
        await mongoose.model("Observation_history").deleteMany({});
    });

    for (const dateCase of DATE_CASES) {
        it(`preserves date ${dateCase.label} through create, read, search, and history`, async function () {
            await assertLexicalRoundTrip({
                resourceType: "Patient",
                field: "birthDate",
                scalar: dateCase.scalar,
                precision: dateCase.precision,
                body: {
                    resourceType: "Patient",
                    gender: "male",
                    birthDate: dateCase.scalar
                },
                searchQuery: { gender: "male" }
            });
        });
    }

    for (const dateTimeCase of DATETIME_CASES) {
        it(`preserves dateTime ${dateTimeCase.label} through create, read, search, and history`, async function () {
            await assertLexicalRoundTrip({
                resourceType: "Patient",
                field: "deceasedDateTime",
                scalar: dateTimeCase.scalar,
                precision: dateTimeCase.precision,
                fractionDigits: dateTimeCase.fractionDigits,
                body: {
                    resourceType: "Patient",
                    gender: "female",
                    birthDate: "1990",
                    deceasedDateTime: dateTimeCase.scalar
                },
                searchQuery: { gender: "female" }
            });
        });
    }

    for (const instantCase of INSTANT_CASES) {
        it(`preserves instant ${instantCase.label} through create, read, search, and history`, async function () {
            await assertLexicalRoundTrip({
                resourceType: "Observation",
                field: "issued",
                scalar: instantCase.scalar,
                precision: instantCase.precision,
                fractionDigits: instantCase.fractionDigits,
                body: {
                    resourceType: "Observation",
                    status: "final",
                    code: { text: "lexical-round-trip" },
                    issued: instantCase.scalar
                },
                searchQuery: { status: "final" }
            });
        });
    }
});
