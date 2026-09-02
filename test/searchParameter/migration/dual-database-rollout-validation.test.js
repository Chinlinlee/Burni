require("module-alias/register");

const path = require("path");
const os = require("os");
const { expect } = require("chai");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { ObjectId } = require("mongodb");
const productionCatalog = require("@models/FHIR/fhir.resourceList.json");
const { EXPECTED_RESOURCE_COUNT } = require("../../support/fhir/resource-catalog");
const { registerDiscoveredModels } = require("@models/mongodb/connector");
const {
    DualDatabaseMigrationError,
    buildMigrationRunIdentity,
    createDualDatabaseConnections,
    runDualDatabaseDryRun,
    runDualDatabasePreflight,
    runDualDatabaseWrite
} = require("@models/FHIR/searchParameter/migration/dualDatabaseOperator");
const { buildCatalogSourceDescriptors } = require("@models/FHIR/searchParameter/migration/sourceReader");
const {
    runStreamingMigration,
    isMigrationRunComplete
} = require("@models/FHIR/searchParameter/migration/streamingMigration");
const { isCanonicalTemporalObject } = require("@models/FHIR/temporal");
const {
    redactMongoUri,
    resolveDatabaseIdentity
} = require("../../../scripts/lib/dual-database-temporal-migrate-cli");

const SOURCE_URI =
    "mongodb://source-user:source-secret@source-host:27017/burni-source?authSource=admin";
const TARGET_URI =
    "mongodb://target-user:target-secret@target-host:27017/burni-target?authSource=admin";

const PATIENT_DISCOVERED_MODELS = {
    resourceModels: ["Patient.js"],
    historyModels: ["Patient_history.js"],
    staticModels: []
};

/** @type {MongoMemoryServer | null} */
let memoryServer = null;

/** @type {import("mongoose").Connection | null} */
let sourceConnection = null;

/** @type {import("mongoose").Connection | null} */
let targetConnection = null;

function runIdentity(overrides = {}) {
    return buildMigrationRunIdentity({
        runId: "rollout-validation-run",
        sourceDatabaseIdentity: "localhost/source-rollout-validation",
        targetDatabaseIdentity: "localhost/target-rollout-validation",
        ...overrides
    });
}

async function countAllTargetDocuments() {
    const collections = await targetConnection.db.listCollections().toArray();
    let total = 0;
    for (const collection of collections) {
        total += await targetConnection.db.collection(collection.name).countDocuments();
    }
    return total;
}

async function insertCollectionDocuments(connection, collectionName, documents) {
    await connection.db.collection(collectionName).insertMany(documents);
}

function buildEvidenceReportDatabaseFields(sourceUri, targetUri) {
    return {
        sourceDatabase: {
            identity: resolveDatabaseIdentity(sourceUri),
            uri: redactMongoUri(sourceUri)
        },
        targetDatabase: {
            identity: resolveDatabaseIdentity(targetUri),
            uri: redactMongoUri(targetUri)
        }
    };
}

describe("dual database rollout validation", function () {
    before(async function () {
        memoryServer = await MongoMemoryServer.create();
        const baseUri = memoryServer.getUri().replace(/\/?$/, "");
        sourceConnection = mongoose.createConnection(`${baseUri}/source-rollout-validation`);
        targetConnection = mongoose.createConnection(`${baseUri}/target-rollout-validation`);
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

    describe("connection isolation and empty target", function () {
        it("opens source and target connections distinct from mongoose default connection", async function () {
            const connections = await createDualDatabaseConnections({
                sourceUri: `${memoryServer.getUri().replace(/\/?$/, "")}/source-rollout-validation`,
                targetUri: `${memoryServer.getUri().replace(/\/?$/, "")}/target-rollout-validation`
            });

            try {
                expect(connections.sourceConnection).to.not.equal(mongoose.connection);
                expect(connections.targetConnection).to.not.equal(mongoose.connection);
                expect(connections.sourceConnection).to.not.equal(connections.targetConnection);
                expect(connections.sourceConnection.readyState).to.equal(1);
                expect(connections.targetConnection.readyState).to.equal(1);
            } finally {
                await connections.close();
            }
        });

        it("keeps target empty after preflight and dry-run while source retains documents", async function () {
            await insertCollectionDocuments(sourceConnection, "Patient", [
                {
                    _id: new ObjectId(),
                    id: "patient-preflight",
                    resourceType: "Patient",
                    birthDate: "1995-06-15"
                }
            ]);

            await runDualDatabasePreflight({
                sourceConnection,
                catalog: ["Patient"],
                includeHistory: false
            });

            expect(await countAllTargetDocuments()).to.equal(0);
            expect(await sourceConnection.db.collection("Patient").countDocuments()).to.equal(1);

            await runDualDatabaseDryRun({
                sourceConnection,
                catalog: ["Patient"],
                includeHistory: false,
                runIdentity: runIdentity()
            });

            expect(await countAllTargetDocuments()).to.equal(0);
            expect(await sourceConnection.db.collection("Patient").countDocuments()).to.equal(1);
        });

        it("redacts credentials in evidence report database fields", function () {
            const report = buildEvidenceReportDatabaseFields(SOURCE_URI, TARGET_URI);
            const serialized = JSON.stringify(report);

            expect(report.sourceDatabase.uri).to.not.include("source-secret");
            expect(report.sourceDatabase.uri).to.not.include("source-user");
            expect(report.targetDatabase.uri).to.not.include("target-secret");
            expect(report.targetDatabase.uri).to.not.include("target-user");
            expect(serialized).to.not.include("source-secret");
            expect(serialized).to.not.include("target-secret");
            expect(report.sourceDatabase.identity).to.equal("source-host:27017/burni-source");
            expect(report.targetDatabase.identity).to.equal("target-host:27017/burni-target");
        });
    });

    describe("identity preservation through dual-db write", function () {
        it("preserves _id, id, and meta.versionId through runDualDatabaseWrite", async function () {
            const patientId = new ObjectId();
            await insertCollectionDocuments(sourceConnection, "Patient", [
                {
                    _id: patientId,
                    id: "patient-identity",
                    resourceType: "Patient",
                    meta: {
                        versionId: "7",
                        lastUpdated: "2024-01-01T00:00:00Z"
                    },
                    birthDate: "1988-12-01"
                }
            ]);

            await runDualDatabaseWrite({
                sourceConnection,
                targetConnection,
                catalog: ["Patient"],
                includeHistory: false,
                batchSize: 10,
                runIdentity: runIdentity(),
                auditPath: path.join(os.tmpdir(), `rollout-audit-${Date.now()}.jsonl`)
            });

            const targetDocument = await targetConnection.db
                .collection("Patient")
                .findOne({ _id: patientId });
            expect(targetDocument).to.exist;
            expect(String(targetDocument._id)).to.equal(String(patientId));
            expect(targetDocument.id).to.equal("patient-identity");
            expect(targetDocument.meta.versionId).to.equal("7");
            expect(isCanonicalTemporalObject(targetDocument.birthDate, "date")).to.equal(true);
        });
    });

    describe("streaming checkpoint and retry via dual-db write path", function () {
        beforeEach(async function () {
            await insertCollectionDocuments(sourceConnection, "Patient", [
                {
                    _id: new ObjectId(),
                    id: "patient-1",
                    resourceType: "Patient",
                    birthDate: "1995-06-15"
                },
                {
                    _id: new ObjectId(),
                    id: "patient-2",
                    resourceType: "Patient",
                    birthDate: "1996-07-16"
                }
            ]);
        });

        it("resumes interrupted runDualDatabaseWrite batches and completes on second pass", async function () {
            const identity = runIdentity({ runId: "rollout-resume-run" });

            try {
                await runDualDatabaseWrite({
                    sourceConnection,
                    targetConnection,
                    catalog: ["Patient"],
                    includeHistory: false,
                    batchSize: 1,
                    maxBatches: 1,
                    runIdentity: identity
                });
                expect.fail("expected incomplete dual database write");
            } catch (error) {
                expect(error).to.be.instanceOf(DualDatabaseMigrationError);
                expect(error.summary).to.deep.include({
                    batchesCompleted: 1,
                    documentsProcessed: 1,
                    status: "incomplete"
                });
            }

            expect(await isMigrationRunComplete(identity, targetConnection)).to.equal(false);
            expect(await targetConnection.db.collection("Patient").countDocuments()).to.equal(1);

            const completed = await runDualDatabaseWrite({
                sourceConnection,
                targetConnection,
                catalog: ["Patient"],
                includeHistory: false,
                batchSize: 1,
                runIdentity: identity
            });

            expect(completed.summary).to.deep.include({
                batchesCompleted: 1,
                batchesSkipped: 1,
                documentsProcessed: 2,
                status: "complete"
            });
            expect(await isMigrationRunComplete(identity, targetConnection)).to.equal(true);
            expect(await targetConnection.db.collection("Patient").countDocuments()).to.equal(2);
        });

        it("skips completed batches on duplicate runDualDatabaseWrite runs", async function () {
            const identity = runIdentity({ runId: "rollout-duplicate-run" });

            const firstRun = await runDualDatabaseWrite({
                sourceConnection,
                targetConnection,
                catalog: ["Patient"],
                includeHistory: false,
                batchSize: 10,
                runIdentity: identity
            });
            expect(firstRun.summary.status).to.equal("complete");

            const secondRun = await runDualDatabaseWrite({
                sourceConnection,
                targetConnection,
                catalog: ["Patient"],
                includeHistory: false,
                batchSize: 10,
                runIdentity: identity
            });

            expect(secondRun.summary).to.deep.include({
                batchesCompleted: 0,
                batchesSkipped: 1,
                documentsProcessed: 2,
                status: "complete"
            });
        });

        it("throws and leaves migration incomplete for partial target runs", async function () {
            const identity = runIdentity({ runId: "rollout-partial-run" });

            try {
                await runDualDatabaseWrite({
                    sourceConnection,
                    targetConnection,
                    catalog: ["Patient"],
                    includeHistory: false,
                    batchSize: 1,
                    maxBatches: 1,
                    runIdentity: identity
                });
                expect.fail("expected partial migration failure");
            } catch (error) {
                expect(error).to.be.instanceOf(DualDatabaseMigrationError);
                expect(error.summary.status).to.equal("incomplete");
            }

            expect(await isMigrationRunComplete(identity, targetConnection)).to.equal(false);
            expect(await targetConnection.db.collection("Patient").countDocuments()).to.equal(1);
        });

        it("records failed checkpoint when target bulk write fails on dual-db stack", async function () {
            const identity = runIdentity({ runId: "rollout-failed-batch-run" });
            await insertCollectionDocuments(sourceConnection, "Patient", [
                {
                    _id: new ObjectId(),
                    id: "patient-fail",
                    resourceType: "Patient",
                    birthDate: "1995-06"
                }
            ]);

            await sourceConnection.db.collection("Patient").deleteMany({
                id: { $in: ["patient-1", "patient-2"] }
            });

            const targetModels = {};
            registerDiscoveredModels(PATIENT_DISCOVERED_MODELS, targetModels, targetConnection);
            const PatientModel = targetModels.Patient;
            const originalBulkWrite = PatientModel.collection.bulkWrite.bind(PatientModel.collection);
            PatientModel.collection.bulkWrite = async function failingBulkWrite() {
                const error = new Error("bulk write failed");
                error.name = "MongoBulkWriteError";
                error.writeErrors = [{ errmsg: "bulk write failed", code: 11000 }];
                throw error;
            };

            try {
                const summary = await runStreamingMigration({
                    sourceConnection,
                    targetConnection,
                    targetModels,
                    catalog: ["Patient"],
                    includeHistory: false,
                    batchSize: 10,
                    runIdentity: identity
                });

                expect(summary).to.deep.include({
                    batchesCompleted: 0,
                    batchesFailed: 1,
                    status: "incomplete"
                });
                expect(await isMigrationRunComplete(identity, targetConnection)).to.equal(false);

                const batches = await targetConnection.db
                    .collection("TemporalMigrationCheckpoint")
                    .find({ runId: identity.runId })
                    .toArray();
                expect(batches).to.have.length(1);
                expect(batches[0].status).to.equal("failed");
                expect(batches[0].errorMetadata).to.deep.include({
                    message: "bulk write failed",
                    code: "11000"
                });
                expect(await targetConnection.db.collection("Patient").countDocuments()).to.equal(0);
            } finally {
                PatientModel.collection.bulkWrite = originalBulkWrite;
            }
        });
    });

    describe("Patient catalog migration coverage", function () {
        it("buildCatalogSourceDescriptors scales to full production catalog", function () {
            expect(productionCatalog).to.have.length(EXPECTED_RESOURCE_COUNT);

            const withHistory = buildCatalogSourceDescriptors(productionCatalog, true);
            const withoutHistory = buildCatalogSourceDescriptors(productionCatalog, false);

            expect(withHistory).to.have.length(EXPECTED_RESOURCE_COUNT * 2);
            expect(withoutHistory).to.have.length(EXPECTED_RESOURCE_COUNT);

            const patientSources = withHistory.filter((source) => source.resource === "Patient");
            expect(patientSources).to.have.length(2);
            expect(patientSources.map((source) => source.kind)).to.include.members([
                "resource",
                "history"
            ]);
            expect(patientSources.map((source) => source.collectionName)).to.include.members([
                "Patient",
                "Patient_history"
            ]);
        });

        it("migrates Patient with history, nested, choice, contained, and temporal array paths", async function () {
            const patientId = new ObjectId();

            await insertCollectionDocuments(sourceConnection, "Patient", [
                {
                    _id: patientId,
                    id: "patient-catalog",
                    resourceType: "Patient",
                    birthDate: "1990-01-15",
                    deceasedDateTime: new Date("2020-01-01T00:00:00.000Z"),
                    contained: [
                        {
                            resourceType: "Observation",
                            effectiveDateTime: "2024-01-01",
                            effectiveTiming: {
                                event: ["2024-01-01T00:00:00Z"]
                            }
                        }
                    ],
                    contact: [
                        {
                            period: {
                                start: "2020-01-01",
                                end: "2020-02-01"
                            }
                        }
                    ]
                }
            ]);
            await insertCollectionDocuments(sourceConnection, "Patient_history", [
                {
                    _id: new ObjectId(),
                    id: "patient-catalog",
                    resourceType: "Patient",
                    meta: { lastUpdated: new Date("2020-01-15T00:00:00.000Z") }
                }
            ]);

            const result = await runDualDatabaseWrite({
                sourceConnection,
                targetConnection,
                catalog: ["Patient"],
                includeHistory: true,
                batchSize: 2,
                runIdentity: runIdentity({ runId: "rollout-catalog-run" }),
                auditPath: path.join(os.tmpdir(), `rollout-catalog-audit-${Date.now()}.jsonl`)
            });

            expect(result.summary.status).to.equal("complete");
            expect(result.summary.documentsProcessed).to.equal(2);

            const targetPatient = await targetConnection.db
                .collection("Patient")
                .findOne({ _id: patientId });
            expect(targetPatient.contained[0].effectiveDateTime).to.have.property("precision");
            expect(targetPatient.contained[0].effectiveTiming.event[0]).to.have.property(
                "normalizedStart"
            );
            expect(targetPatient.contact[0].period.start).to.have.property("normalizedStart");
            expect(isCanonicalTemporalObject(targetPatient.deceasedDateTime, "dateTime")).to.equal(
                true
            );
            expect(
                await targetConnection.db.collection("Patient_history").countDocuments()
            ).to.equal(1);
        });
    });
});
