require("module-alias/register");

const path = require("path");
const os = require("os");
const { expect } = require("chai");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { ObjectId } = require("mongodb");
const {
    TEMPORAL_CATEGORIES
} = require("@models/FHIR/searchParameter/migration/temporalPreflight");
const {
    DualDatabasePreflightError,
    DualDatabaseMigrationError,
    buildMigrationRunIdentity,
    createDualDatabaseConnections,
    runDualDatabaseDryRun,
    runDualDatabasePreflight,
    runDualDatabaseWrite
} = require("@models/FHIR/searchParameter/migration/dualDatabaseOperator");
const { isCanonicalTemporalObject, normalizeDate } = require("@models/FHIR/temporal");

/** @type {MongoMemoryServer | null} */
let memoryServer = null;

/** @type {import("mongoose").Connection | null} */
let sourceConnection = null;

/** @type {import("mongoose").Connection | null} */
let targetConnection = null;

/** @type {string | null} */
let sourceUri = null;

/** @type {string | null} */
let targetUri = null;

function runIdentity(overrides = {}) {
    return buildMigrationRunIdentity({
        runId: "dual-db-run-1",
        sourceDatabaseIdentity: "localhost/source-dual-db-test",
        targetDatabaseIdentity: "localhost/target-dual-db-test",
        ...overrides
    });
}

async function insertPatientDocuments(connection, documents) {
    await connection.db.collection("Patient").insertMany(documents);
}

describe("dual database operator", function () {
    before(async function () {
        memoryServer = await MongoMemoryServer.create();
        const baseUri = memoryServer.getUri().replace(/\/?$/, "");
        sourceUri = `${baseUri}/source-dual-db-test`;
        targetUri = `${baseUri}/target-dual-db-test`;
        sourceConnection = mongoose.createConnection(sourceUri);
        targetConnection = mongoose.createConnection(targetUri);
        await Promise.all([sourceConnection.asPromise(), targetConnection.asPromise()]);
    });

    after(async function () {
        if (sourceConnection) {
            await sourceConnection.close();
            sourceConnection = null;
        }
        if (targetConnection) {
            await targetConnection.close();
            targetConnection = null;
        }
        if (memoryServer) {
            await memoryServer.stop();
            memoryServer = null;
        }
    });

    beforeEach(async function () {
        await sourceConnection.db.dropDatabase();
        await targetConnection.db.dropDatabase();
    });

    it("buildMigrationRunIdentity validates run identity fields", function () {
        expect(runIdentity()).to.deep.equal({
            runId: "dual-db-run-1",
            sourceDatabaseIdentity: "localhost/source-dual-db-test",
            targetDatabaseIdentity: "localhost/target-dual-db-test"
        });
    });

    it("createDualDatabaseConnections opens distinct source and target connections", async function () {
        const connections = await createDualDatabaseConnections({
            sourceUri,
            targetUri
        });

        try {
            expect(connections.sourceConnection.db.databaseName).to.equal("source-dual-db-test");
            expect(connections.targetConnection.db.databaseName).to.equal("target-dual-db-test");
            expect(connections.sourceDatabaseIdentity).to.match(/source-dual-db-test$/);
            expect(connections.targetDatabaseIdentity).to.match(/target-dual-db-test$/);
            expect(connections.sourceDatabaseIdentity).to.not.equal(
                connections.targetDatabaseIdentity
            );
        } finally {
            await connections.close();
        }
    });

    it("createDualDatabaseConnections rejects identical source and target URIs", async function () {
        const sameUri = `${memoryServer.getUri().replace(/\/?$/, "")}/same-db-test`;
        try {
            await createDualDatabaseConnections({
                sourceUri: sameUri,
                targetUri: sameUri
            });
            expect.fail("expected same-database rejection");
        } catch (error) {
            expect(error.message).to.match(/same database/i);
        }
    });

    it("runDualDatabasePreflight detects canonical, legacy, and lossy BSON temporal values", async function () {
        await insertPatientDocuments(sourceConnection, [
            {
                _id: new ObjectId(),
                id: "patient-canonical",
                resourceType: "Patient",
                birthDate: normalizeDate("1990-01-15")
            },
            {
                _id: new ObjectId(),
                id: "patient-legacy",
                resourceType: "Patient",
                birthDate: "1995-06-15"
            },
            {
                _id: new ObjectId(),
                id: "patient-lossy",
                resourceType: "Patient",
                birthDate: new Date("2020-01-01T00:00:00.000Z"),
                deceasedDateTime: new Date("2021-06-15T12:00:00.000Z")
            }
        ]);

        const report = await runDualDatabasePreflight({
            sourceConnection,
            catalog: ["Patient"],
            includeHistory: false,
            batchSize: 2
        });

        expect(report.readOnly).to.equal(true);
        expect(report.valid).to.equal(true);
        expect(report.summary).to.include({
            resourcesInCatalog: 1,
            sourcesScanned: 1,
            unavailableSources: 0,
            documentsScanned: 3,
            canonical: 1,
            legacyStrings: 1,
            lossyBsonDates: 2,
            unresolvedAmbiguousBsonDates: 0,
            invalid: 0
        });

        const categories = report.diagnostics.map((diagnostic) => diagnostic.category);
        expect(categories).to.include.members([
            TEMPORAL_CATEGORIES.CANONICAL,
            TEMPORAL_CATEGORIES.LEGACY_STRING,
            TEMPORAL_CATEGORIES.ABSOLUTE_BSON_DATE
        ]);
    });

    it("runDualDatabasePreflight skips missing collections without failing", async function () {
        const report = await runDualDatabasePreflight({
            sourceConnection,
            catalog: ["Patient", "Observation"],
            includeHistory: false,
            batchSize: 10
        });

        expect(report.valid).to.equal(true);
        expect(report.summary.unavailableSources).to.equal(0);
        expect(report.summary.sourcesScanned).to.equal(0);
        expect(report.summary.documentsScanned).to.equal(0);
    });

    it("runDualDatabasePreflight treats empty collections as available with zero documents", async function () {
        await sourceConnection.db.createCollection("Patient");

        const report = await runDualDatabasePreflight({
            sourceConnection,
            catalog: ["Patient"],
            includeHistory: false
        });

        expect(report.valid).to.equal(true);
        expect(report.summary.unavailableSources).to.equal(0);
        expect(report.summary.sourcesScanned).to.equal(1);
        expect(report.summary.documentsScanned).to.equal(0);
        expect(report.sources[0]).to.include({
            resource: "Patient",
            available: true,
            documentCount: 0
        });
    });

    it("runDualDatabaseDryRun transforms source documents without writing to target", async function () {
        const firstId = new ObjectId();
        const secondId = new ObjectId();
        await insertPatientDocuments(sourceConnection, [
            {
                _id: firstId,
                id: "patient-1",
                resourceType: "Patient",
                birthDate: "1995-06-15",
                deceasedDateTime: new Date("2020-01-01T00:00:00.000Z")
            },
            {
                _id: secondId,
                id: "patient-2",
                resourceType: "Patient",
                birthDate: "1995-06"
            }
        ]);

        const result = await runDualDatabaseDryRun({
            sourceConnection,
            catalog: ["Patient"],
            includeHistory: false,
            batchSize: 10,
            runIdentity: runIdentity()
        });

        expect(result.summary).to.deep.include({
            documentsProcessed: 2,
            batchesProcessed: 1
        });
        expect(result.summary.auditEntries).to.have.length(3);
        expect(await targetConnection.db.collection("Patient").countDocuments()).to.equal(0);
        expect(await sourceConnection.db.collection("Patient").countDocuments()).to.equal(2);
    });

    it("runDualDatabaseDryRun accepts distinct source and target connections", async function () {
        await insertPatientDocuments(sourceConnection, [
            {
                _id: new ObjectId(),
                id: "patient-1",
                resourceType: "Patient",
                birthDate: "1995-06"
            }
        ]);

        expect(sourceConnection.db.databaseName).to.not.equal(targetConnection.db.databaseName);

        const result = await runDualDatabaseDryRun({
            sourceConnection,
            catalog: ["Patient"],
            includeHistory: false,
            runIdentity: runIdentity(),
            runPreflight: true
        });

        expect(result.summary.documentsProcessed).to.equal(1);
        expect(await targetConnection.db.collection("Patient").countDocuments()).to.equal(0);
    });

    it("runDualDatabaseDryRun throws DualDatabaseMigrationError when transform fails", async function () {
        await insertPatientDocuments(sourceConnection, [
            {
                _id: new ObjectId(),
                id: "patient-invalid",
                resourceType: "Patient",
                birthDate: "not-a-date"
            }
        ]);

        try {
            await runDualDatabaseDryRun({
                sourceConnection,
                catalog: ["Patient"],
                includeHistory: false,
                runIdentity: runIdentity()
            });
            expect.fail("expected dry-run transform failure");
        } catch (error) {
            expect(error).to.be.instanceOf(DualDatabaseMigrationError);
            expect(error.metadata).to.include({ phase: "transform" });
        }
    });

    it("runDualDatabaseDryRun audit entries describe canonical conversion output", async function () {
        await insertPatientDocuments(sourceConnection, [
            {
                _id: new ObjectId(),
                id: "patient-1",
                resourceType: "Patient",
                birthDate: "1995-06-15"
            }
        ]);

        const result = await runDualDatabaseDryRun({
            sourceConnection,
            catalog: ["Patient"],
            includeHistory: false,
            runIdentity: runIdentity()
        });

        const auditEntry = result.summary.auditEntries[0];
        expect(isCanonicalTemporalObject(auditEntry.generatedValue, "date")).to.equal(true);
        expect(auditEntry.generatedValue).to.deep.include({
            value: "1995-06-15",
            precision: "day"
        });
    });

    it("runDualDatabaseWrite copies transformed documents to target", async function () {
        const patientId = new ObjectId();
        await insertPatientDocuments(sourceConnection, [
            {
                _id: patientId,
                id: "patient-3",
                resourceType: "Patient",
                birthDate: "1988-12-01"
            }
        ]);

        const result = await runDualDatabaseWrite({
            sourceConnection,
            targetConnection,
            catalog: ["Patient"],
            includeHistory: false,
            batchSize: 10,
            runIdentity: runIdentity(),
            auditPath: path.join(os.tmpdir(), `dual-db-audit-${Date.now()}.jsonl`)
        });

        expect(result.summary.status).to.equal("complete");
        expect(result.summary.documentsProcessed).to.equal(1);
        const targetDocument = await targetConnection.db
            .collection("Patient")
            .findOne({ _id: patientId });
        expect(targetDocument).to.exist;
        expect(targetDocument.birthDate).to.deep.include({
            value: "1988-12-01",
            precision: "day"
        });
    });

    it("runDualDatabaseWrite throws DualDatabasePreflightError for invalid temporal values", async function () {
        await insertPatientDocuments(sourceConnection, [
            {
                _id: new ObjectId(),
                id: "patient-invalid",
                resourceType: "Patient",
                birthDate: "not-a-date"
            }
        ]);

        try {
            await runDualDatabaseWrite({
                sourceConnection,
                targetConnection,
                catalog: ["Patient"],
                includeHistory: false,
                batchSize: 10,
                runIdentity: runIdentity()
            });
            expect.fail("expected preflight failure");
        } catch (error) {
            expect(error).to.be.instanceOf(DualDatabasePreflightError);
            expect(error.report.summary.invalid).to.equal(1);
        }
    });
});
