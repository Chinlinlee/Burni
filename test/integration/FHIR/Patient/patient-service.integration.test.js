require("module-alias/register");

const { expect } = require("chai");
const {
    dropMongoTestDatabase,
    startMongoMemory,
    stopMongoMemory
} = require("../../../support/mongo-memory");
const {
    clearPatientCollection,
    createPatientViaService,
    readPatientViaService
} = require("../../../support/fhir/patient-service");

describe("Patient FHIR service integration", function () {
    let patientId;

    before(async function () {
        this.timeout(120000);
        await startMongoMemory();
    });

    after(async function () {
        await dropMongoTestDatabase();
        await stopMongoMemory();
    });

    beforeEach(async function () {
        await clearPatientCollection();
        const patient = await createPatientViaService({
            resourceType: "Patient",
            gender: "male",
            name: [{ family: "ServiceTest" }]
        });
        patientId = patient.id;
    });

    it("creates and reads Patient through FHIR services", async function () {
        const readResult = await readPatientViaService(patientId);
        expect(readResult.status).to.equal(true);
        expect(readResult.code).to.equal(200);
        expect(readResult.result.id).to.equal(patientId);
        expect(readResult.result.gender).to.equal("male");
    });
});
