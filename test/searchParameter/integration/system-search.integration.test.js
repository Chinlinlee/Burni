require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const {
    normalizeResourceTemporals
} = require("@models/FHIR/temporal");
const {
    startRegistryTestContext,
    stopRegistryTestContext
} = require("../support/registry-test-context");
const {
    clearPatientCollection,
    searchPatientViaService,
    getBundlePatientIds
} = require("../../support/fhir/patient-service");
const { ensureMongodbConnectorLoaded } = require("../../support/fhir/fhir-service");

const SYSTEM_PATIENTS = [
    {
        id: "CaseSensitiveId",
        lastUpdated: "2020-01-01T00:00:00Z"
    },
    {
        id: "updated-midday",
        lastUpdated: "2020-06-15T12:00:00Z"
    },
    {
        id: "updated-late",
        lastUpdated: "2021-12-31T23:59:59Z"
    }
];

async function insertSystemPatients() {
    ensureMongodbConnectorLoaded();
    const patients = SYSTEM_PATIENTS.map(({ id, lastUpdated }) =>
        normalizeResourceTemporals({
            resourceType: "Patient",
            id,
            meta: {
                versionId: "1",
                lastUpdated
            }
        })
    );
    await mongoose.model("Patient").collection.insertMany(patients);
}

describe("FHIR system search parameters", function () {
    before(async function () {
        this.timeout(120000);
        await startRegistryTestContext();
    });

    after(async function () {
        await stopRegistryTestContext();
    });

    beforeEach(async function () {
        await clearPatientCollection();
        await insertSystemPatients();
    });

    it("searches the logical id with an exact, case-sensitive match", async function () {
        const exactResult = await searchPatientViaService({ _id: "CaseSensitiveId" });
        const differentCaseResult = await searchPatientViaService({ _id: "casesensitiveid" });
        const missingResult = await searchPatientViaService({ _id: "missing-id" });

        expect(exactResult.status).to.equal(true);
        expect(exactResult.code).to.equal(200);
        expect(exactResult.result.resourceType).to.equal("Bundle");
        expect(exactResult.result.type).to.equal("searchset");
        expect(getBundlePatientIds(exactResult.result)).to.deep.equal(["CaseSensitiveId"]);
        expect(getBundlePatientIds(differentCaseResult.result)).to.deep.equal([]);
        expect(missingResult.status).to.equal(true);
        expect(missingResult.result.type).to.equal("searchset");
        expect(getBundlePatientIds(missingResult.result)).to.deep.equal([]);
    });

    for (const testCase of [
        { query: "eq2020-06-15", expected: ["updated-midday"] },
        { query: "eq2020-06", expected: ["updated-midday"] },
        { query: "ge2020", expected: ["CaseSensitiveId", "updated-midday", "updated-late"] },
        { query: "ne2020-06-15", expected: ["CaseSensitiveId", "updated-late"] },
        { query: "gt2020-06-15", expected: ["updated-late"] },
        { query: "gt2020-06-15T12:00:00Z", expected: ["updated-late"] },
        { query: "gt2020-06-15T14:00:00+02:00", expected: ["updated-late"] },
        { query: "ge2020-06-15", expected: ["updated-midday", "updated-late"] },
        { query: "lt2020-06-15", expected: ["CaseSensitiveId"] },
        { query: "le2020-06-15", expected: ["CaseSensitiveId", "updated-midday"] },
        { query: "sa2020-06-15", expected: ["updated-late"] },
        { query: "eb2020-06-15", expected: ["CaseSensitiveId"] },
        { query: "ap2020-06-15", expected: ["updated-midday"] }
    ]) {
        it(`supports _lastUpdated=${testCase.query}`, async function () {
            const result = await searchPatientViaService({
                _lastUpdated: testCase.query
            });

            expect(result.status).to.equal(true);
            expect(result.code).to.equal(200);
            expect(result.result.resourceType).to.equal("Bundle");
            expect(result.result.type).to.equal("searchset");
            expect(getBundlePatientIds(result.result)).to.have.members(testCase.expected);
            expect(getBundlePatientIds(result.result)).to.have.lengthOf(testCase.expected.length);
        });
    }
});
