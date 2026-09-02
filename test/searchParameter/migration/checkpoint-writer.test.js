require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const {
    createCheckpointWriter,
    resolveCheckpointModel
} = require("@models/FHIR/searchParameter/migration/checkpointWriter");
const {
    validateCheckpointRecord,
    MigrationContractError
} = require("@models/FHIR/searchParameter/migration/migrationContracts");

/** @type {MongoMemoryServer | null} */
let memoryServer = null;

/** @type {import("mongoose").Connection | null} */
let connection = null;

function baseRunIdentity(overrides = {}) {
    return {
        runId: "run-1",
        sourceDatabaseIdentity: "source-db",
        targetDatabaseIdentity: "target-db",
        ...overrides
    };
}

function checkpointRecord(overrides = {}) {
    return {
        runId: "run-1",
        collection: "Patient",
        batchId: "batch-1",
        status: "started",
        counts: {},
        ...overrides
    };
}

describe("checkpoint writer", function () {
    before(async function () {
        memoryServer = await MongoMemoryServer.create();
        connection = mongoose.createConnection(memoryServer.getUri());
        await connection.asPromise();
        resolveCheckpointModel(connection);
    });

    after(async function () {
        if (connection) {
            await connection.close();
            connection = null;
        }
        if (memoryServer) {
            await memoryServer.stop();
            memoryServer = null;
        }
    });

    beforeEach(async function () {
        await connection.db.dropDatabase();
    });

    it("persists started then completed checkpoint lifecycle with counts", async function () {
        const writer = createCheckpointWriter({
            targetConnection: connection,
            runIdentity: baseRunIdentity()
        });

        await writer.markBatchStarted(
            checkpointRecord({
                status: "started",
                sourceIds: ["doc-1", "doc-2"],
                boundary: {
                    batchId: "batch-1",
                    collection: "Patient",
                    documentCount: 2,
                    sourceIds: ["doc-1", "doc-2"],
                    resumeToken: "token-1"
                }
            })
        );

        let checkpoint = await writer.getCheckpoint("run-1", "Patient", "batch-1");
        validateCheckpointRecord(checkpoint);
        expect(checkpoint).to.deep.equal({
            runId: "run-1",
            collection: "Patient",
            batchId: "batch-1",
            status: "started",
            counts: {}
        });

        await writer.markBatchCompleted(
            checkpointRecord({
                status: "completed",
                counts: { sourceCount: 2, targetCount: 2 }
            })
        );

        checkpoint = await writer.getCheckpoint("run-1", "Patient", "batch-1");
        validateCheckpointRecord(checkpoint);
        expect(checkpoint).to.deep.equal({
            runId: "run-1",
            collection: "Patient",
            batchId: "batch-1",
            status: "completed",
            counts: { sourceCount: 2, targetCount: 2 }
        });

        const stored = await connection.db
            .collection("TemporalMigrationCheckpoint")
            .findOne({ runId: "run-1", collection: "Patient", batchId: "batch-1" });
        expect(stored.sourceDatabaseIdentity).to.equal("source-db");
        expect(stored.targetDatabaseIdentity).to.equal("target-db");
        expect(stored.sourceIds).to.deep.equal(["doc-1", "doc-2"]);
        expect(stored.boundary).to.deep.equal({
            batchId: "batch-1",
            collection: "Patient",
            documentCount: 2,
            sourceIds: ["doc-1", "doc-2"],
            resumeToken: "token-1"
        });
        expect(stored.createdAt).to.be.instanceOf(Date);
        expect(stored.updatedAt).to.be.instanceOf(Date);
    });

    it("requires explicit counts when marking a batch completed", async function () {
        const writer = createCheckpointWriter({
            targetConnection: connection,
            runIdentity: baseRunIdentity()
        });

        await writer.markBatchStarted(checkpointRecord({ status: "started" }));

        try {
            await writer.markBatchCompleted(
                checkpointRecord({
                    status: "completed",
                    counts: { sourceCount: 2 }
                })
            );
            expect.fail("markBatchCompleted should require targetCount");
        } catch (error) {
            expect(error).to.be.instanceOf(MigrationContractError);
            expect(error.message).to.match(/counts\.targetCount/);
        }

        const checkpoint = await writer.getCheckpoint("run-1", "Patient", "batch-1");
        expect(checkpoint?.status).to.equal("started");
    });

    it("stores error metadata when markBatchFailed is called", async function () {
        const writer = createCheckpointWriter({
            targetConnection: connection,
            runIdentity: baseRunIdentity()
        });

        await writer.markBatchStarted(checkpointRecord({ status: "started" }));
        await writer.markBatchFailed(
            checkpointRecord({
                status: "failed",
                errorMetadata: {
                    message: "bulk write failed",
                    code: "MIGRATION_TARGET_BATCH_WRITE_FAILED",
                    at: "2026-09-02T11:00:00.000Z"
                }
            })
        );

        const checkpoint = await writer.getCheckpoint("run-1", "Patient", "batch-1");
        validateCheckpointRecord(checkpoint);
        expect(checkpoint).to.deep.equal({
            runId: "run-1",
            collection: "Patient",
            batchId: "batch-1",
            status: "failed",
            counts: {},
            errorMetadata: {
                message: "bulk write failed",
                code: "MIGRATION_TARGET_BATCH_WRITE_FAILED",
                at: "2026-09-02T11:00:00.000Z"
            }
        });
    });

    it("lists completed batches filtered by runId and optional collection", async function () {
        const writer = createCheckpointWriter({
            targetConnection: connection,
            runIdentity: baseRunIdentity()
        });

        await writer.markBatchStarted(
            checkpointRecord({ batchId: "batch-a", status: "started", collection: "Patient" })
        );
        await writer.markBatchCompleted(
            checkpointRecord({
                batchId: "batch-a",
                status: "completed",
                collection: "Patient",
                counts: { sourceCount: 1, targetCount: 1 }
            })
        );

        await writer.markBatchStarted(
            checkpointRecord({ batchId: "batch-b", status: "started", collection: "Observation" })
        );
        await writer.markBatchCompleted(
            checkpointRecord({
                batchId: "batch-b",
                status: "completed",
                collection: "Observation",
                counts: { sourceCount: 3, targetCount: 3 }
            })
        );

        await writer.markBatchStarted(
            checkpointRecord({ batchId: "batch-c", status: "started", collection: "Patient" })
        );
        await writer.markBatchFailed(
            checkpointRecord({
                batchId: "batch-c",
                status: "failed",
                collection: "Patient",
                errorMetadata: { message: "failed batch" }
            })
        );

        const allCompleted = await writer.listCompletedBatches("run-1");
        expect(allCompleted).to.have.length(2);
        expect(allCompleted.map((record) => record.batchId)).to.deep.equal(["batch-a", "batch-b"]);

        const patientCompleted = await writer.listCompletedBatches("run-1", "Patient");
        expect(patientCompleted).to.have.length(1);
        expect(patientCompleted[0]).to.deep.include({
            batchId: "batch-a",
            collection: "Patient",
            status: "completed"
        });
    });

    it("isolates checkpoint records by runId", async function () {
        const runOneWriter = createCheckpointWriter({
            targetConnection: connection,
            runIdentity: baseRunIdentity({ runId: "run-1" })
        });
        const runTwoWriter = createCheckpointWriter({
            targetConnection: connection,
            runIdentity: baseRunIdentity({ runId: "run-2" })
        });

        await runOneWriter.markBatchStarted(
            checkpointRecord({ runId: "run-1", batchId: "batch-1", status: "started" })
        );
        await runOneWriter.markBatchCompleted(
            checkpointRecord({
                runId: "run-1",
                batchId: "batch-1",
                status: "completed",
                counts: { sourceCount: 1, targetCount: 1 }
            })
        );

        await runTwoWriter.markBatchStarted(
            checkpointRecord({ runId: "run-2", batchId: "batch-1", status: "started" })
        );

        const runOneCheckpoint = await runOneWriter.getCheckpoint("run-1", "Patient", "batch-1");
        const runTwoCheckpoint = await runTwoWriter.getCheckpoint("run-2", "Patient", "batch-1");
        expect(runOneCheckpoint?.status).to.equal("completed");
        expect(runTwoCheckpoint?.status).to.equal("started");

        const runOneCompleted = await runOneWriter.listCompletedBatches("run-1");
        const runTwoCompleted = await runTwoWriter.listCompletedBatches("run-2");
        expect(runOneCompleted).to.have.length(1);
        expect(runTwoCompleted).to.have.length(0);
    });

    it("returns null when checkpoint does not exist", async function () {
        const writer = createCheckpointWriter({
            targetConnection: connection,
            runIdentity: baseRunIdentity()
        });

        const checkpoint = await writer.getCheckpoint("run-1", "Patient", "missing-batch");
        expect(checkpoint).to.equal(null);
    });
});
