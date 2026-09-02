require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { ObjectId } = require("mongodb");
const { registerDiscoveredModels } = require("@models/mongodb/connector");
const {
    runDualDatabaseMigrationBatchLoop,
    isMigrationRunComplete
} = require("@models/FHIR/searchParameter/migration/dualDatabaseOperator");
const { isCanonicalTemporalObject } = require("@models/FHIR/temporal");

const DISCOVERED_MODELS = {
    resourceModels: ["Patient.js"],
    historyModels: [],
    staticModels: []
};

/** @type {MongoMemoryServer | null} */
let memoryServer = null;

/** @type {import("mongoose").Connection | null} */
let sourceConnection = null;

/** @type {import("mongoose").Connection | null} */
let targetConnection = null;

/** @type {Record<string, import("mongoose").Model>} */
let targetModels = {};

function baseRunIdentity(overrides = {}) {
    return {
        runId: "streaming-run-1",
        sourceDatabaseIdentity: "source-db",
        targetDatabaseIdentity: "target-db",
        ...overrides
    };
}

async function insertPatientDocuments(connection, documents) {
    await connection.db.collection("Patient").insertMany(documents);
}

function migrationOptions(overrides = {}) {
    return {
        sourceConnection,
        targetConnection,
        targetModels,
        catalog: ["Patient"],
        includeHistory: false,
        batchSize: 10,
        ...overrides
    };
}

describe("streaming migration", function () {
    before(async function () {
        memoryServer = await MongoMemoryServer.create();
        const baseUri = memoryServer.getUri().replace(/\/?$/, "");
        sourceConnection = mongoose.createConnection(`${baseUri}/source-migration-test`);
        targetConnection = mongoose.createConnection(`${baseUri}/target-migration-test`);
        await Promise.all([sourceConnection.asPromise(), targetConnection.asPromise()]);
        targetModels = {};
        registerDiscoveredModels(DISCOVERED_MODELS, targetModels, targetConnection);
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

    it("migrates source documents to target with transformed temporal values", async function () {
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

        const summary = await runDualDatabaseMigrationBatchLoop(
            migrationOptions({
                runIdentity: baseRunIdentity(),
                batchSize: 10
            })
        );

        expect(summary).to.deep.include({
            batchesCompleted: 1,
            batchesFailed: 0,
            batchesSkipped: 0,
            documentsProcessed: 2,
            status: "complete"
        });
        expect(await isMigrationRunComplete(baseRunIdentity(), targetConnection)).to.equal(true);

        const stored = await targetConnection.db
            .collection("Patient")
            .find({})
            .sort({ id: 1 })
            .toArray();
        expect(stored).to.have.length(2);
        expect(String(stored[0]._id)).to.equal(String(firstId));
        expect(isCanonicalTemporalObject(stored[0].birthDate, "date")).to.equal(true);
        expect(stored[0].birthDate).to.deep.include({
            value: "1995-06-15",
            precision: "day"
        });
        expect(isCanonicalTemporalObject(stored[0].deceasedDateTime, "dateTime")).to.equal(true);
        expect(isCanonicalTemporalObject(stored[1].birthDate, "date")).to.equal(true);
        expect(stored[1].birthDate).to.deep.include({
            value: "1995-06",
            precision: "month"
        });
    });

    it("resumes by skipping completed batches and finishing remaining work", async function () {
        const firstId = new ObjectId();
        const secondId = new ObjectId();
        await insertPatientDocuments(sourceConnection, [
            {
                _id: firstId,
                id: "patient-1",
                resourceType: "Patient",
                birthDate: "1995-06-15"
            },
            {
                _id: secondId,
                id: "patient-2",
                resourceType: "Patient",
                birthDate: "1996-07-16"
            }
        ]);

        const runIdentity = baseRunIdentity();
        const firstPass = await runDualDatabaseMigrationBatchLoop(
            migrationOptions({
                runIdentity,
                batchSize: 1,
                maxBatches: 1
            })
        );

        expect(firstPass).to.deep.include({
            batchesCompleted: 1,
            batchesFailed: 0,
            batchesSkipped: 0,
            documentsProcessed: 1,
            status: "incomplete"
        });
        expect(await isMigrationRunComplete(runIdentity, targetConnection)).to.equal(false);

        const secondPass = await runDualDatabaseMigrationBatchLoop(
            migrationOptions({
                runIdentity,
                batchSize: 1
            })
        );

        expect(secondPass).to.deep.include({
            batchesCompleted: 1,
            batchesFailed: 0,
            batchesSkipped: 1,
            documentsProcessed: 2,
            status: "complete"
        });
        expect(await isMigrationRunComplete(runIdentity, targetConnection)).to.equal(true);

        const stored = await targetConnection.db.collection("Patient").find({}).toArray();
        expect(stored).to.have.length(2);
    });

    it("does not mark a batch completed when target write fails", async function () {
        await insertPatientDocuments(sourceConnection, [
            {
                _id: new ObjectId(),
                id: "patient-1",
                resourceType: "Patient",
                birthDate: "1995-06"
            }
        ]);

        const PatientModel = targetModels.Patient;
        const originalBulkWrite = PatientModel.collection.bulkWrite.bind(PatientModel.collection);
        PatientModel.collection.bulkWrite = async function failingBulkWrite() {
            const error = new Error("bulk write failed");
            error.name = "MongoBulkWriteError";
            error.writeErrors = [
                {
                    errmsg: "bulk write failed",
                    code: 11000
                }
            ];
            throw error;
        };

        try {
            const runIdentity = baseRunIdentity();
            const summary = await runDualDatabaseMigrationBatchLoop(
                migrationOptions({
                    runIdentity,
                    batchSize: 10
                })
            );

            expect(summary).to.deep.include({
                batchesCompleted: 0,
                batchesFailed: 1,
                batchesSkipped: 0,
                documentsProcessed: 0,
                status: "incomplete"
            });
            expect(await isMigrationRunComplete(runIdentity, targetConnection)).to.equal(false);

            const batches = await targetConnection.db
                .collection("TemporalMigrationCheckpoint")
                .find({ runId: runIdentity.runId })
                .toArray();
            expect(batches).to.have.length(1);
            expect(batches[0].status).to.equal("failed");
            expect(batches[0].errorMetadata).to.deep.include({
                message: "bulk write failed",
                code: "11000"
            });

            const stored = await targetConnection.db.collection("Patient").find({}).toArray();
            expect(stored).to.have.length(0);
        } finally {
            PatientModel.collection.bulkWrite = originalBulkWrite;
        }
    });

    it("skips completed batches on duplicate runs", async function () {
        await insertPatientDocuments(sourceConnection, [
            {
                _id: new ObjectId(),
                id: "patient-1",
                resourceType: "Patient",
                birthDate: "1995-06"
            }
        ]);

        const runIdentity = baseRunIdentity();
        const firstRun = await runDualDatabaseMigrationBatchLoop(
            migrationOptions({
                runIdentity,
                batchSize: 10
            })
        );
        expect(firstRun.status).to.equal("complete");

        const secondRun = await runDualDatabaseMigrationBatchLoop(
            migrationOptions({
                runIdentity,
                batchSize: 10
            })
        );

        expect(secondRun).to.deep.include({
            batchesCompleted: 0,
            batchesFailed: 0,
            batchesSkipped: 1,
            documentsProcessed: 1,
            status: "complete"
        });
    });

    it("returns incomplete status for partial target runs", async function () {
        await insertPatientDocuments(sourceConnection, [
            {
                _id: new ObjectId(),
                id: "patient-1",
                resourceType: "Patient",
                birthDate: "1995-06"
            },
            {
                _id: new ObjectId(),
                id: "patient-2",
                resourceType: "Patient",
                birthDate: "1996-07"
            }
        ]);

        const summary = await runDualDatabaseMigrationBatchLoop(
            migrationOptions({
                runIdentity: baseRunIdentity(),
                batchSize: 1,
                maxBatches: 1
            })
        );

        expect(summary).to.deep.include({
            batchesCompleted: 1,
            batchesFailed: 0,
            batchesSkipped: 0,
            documentsProcessed: 1,
            status: "incomplete"
        });
        expect(await isMigrationRunComplete(baseRunIdentity(), targetConnection)).to.equal(false);

        const stored = await targetConnection.db.collection("Patient").find({}).toArray();
        expect(stored).to.have.length(1);
    });
});
