require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { ObjectId } = require("mongodb");
const { registerDiscoveredModels } = require("@models/mongodb/connector");
const {
    createTargetBatchWriter,
    buildBulkWriteOperations
} = require("@models/FHIR/searchParameter/migration/targetBatchWriter");
const { validateMigrationBatchResult } = require("@models/FHIR/searchParameter/migration/migrationContracts");

const DISCOVERED_MODELS = {
    resourceModels: ["Patient.js"],
    historyModels: [],
    staticModels: []
};

/** @type {MongoMemoryServer | null} */
let memoryServer = null;

/** @type {import("mongoose").Connection | null} */
let connection = null;

/** @type {Record<string, import("mongoose").Model>} */
let targetModels = {};

function baseRunIdentity(overrides = {}) {
    return {
        runId: "run-1",
        sourceDatabaseIdentity: "source-db",
        targetDatabaseIdentity: "target-db",
        ...overrides
    };
}

function patientSource(overrides = {}) {
    return {
        resource: "Patient",
        model: "Patient",
        kind: "resource",
        collectionName: "Patient",
        ...overrides
    };
}

function writeContext(overrides = {}) {
    return {
        runIdentity: baseRunIdentity(),
        source: patientSource(),
        batchId: "batch-1",
        ...overrides
    };
}

describe("target batch writer", function () {
    before(async function () {
        memoryServer = await MongoMemoryServer.create();
        connection = mongoose.createConnection(memoryServer.getUri());
        await connection.asPromise();
        targetModels = {};
        registerDiscoveredModels(DISCOVERED_MODELS, targetModels, connection);
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

    it("builds replaceOne upsert operations that preserve _id", function () {
        const documentId = new ObjectId();
        const operations = buildBulkWriteOperations([
            {
                _id: documentId,
                id: "patient-1",
                resourceType: "Patient",
                active: true
            }
        ]);

        expect(operations).to.deep.equal([
            {
                replaceOne: {
                    filter: { _id: documentId },
                    replacement: {
                        _id: documentId,
                        id: "patient-1",
                        resourceType: "Patient",
                        active: true
                    },
                    upsert: true
                }
            }
        ]);
    });

    it("writes full documents to target collection via bulkWrite", async function () {
        const documentId = new ObjectId();
        const documents = [
            {
                _id: documentId,
                id: "patient-1",
                resourceType: "Patient",
                active: true,
                birthDate: {
                    value: "1995-06",
                    precision: "month",
                    normalizedStart: "1995-06-01",
                    normalizedEnd: "1995-07-01"
                }
            }
        ];

        const writer = createTargetBatchWriter({
            targetConnection: connection,
            targetModels
        });
        const result = await writer.writeBatch("Patient", documents, writeContext());

        validateMigrationBatchResult(result);
        expect(result.status).to.equal("completed");
        expect(result.sourceCount).to.equal(1);
        expect(result.targetCount).to.equal(1);
        expect(result.errors).to.deep.equal([]);

        const stored = await connection.db.collection("Patient").findOne({ _id: documentId });
        expect(stored).to.deep.equal(documents[0]);
    });

    it("preserves _id and document content on upsert", async function () {
        const documentId = new ObjectId();
        const writer = createTargetBatchWriter({
            targetConnection: connection,
            targetModels
        });

        const firstWrite = await writer.writeBatch(
            "Patient",
            [
                {
                    _id: documentId,
                    id: "patient-1",
                    resourceType: "Patient",
                    active: true
                }
            ],
            writeContext({ batchId: "batch-first" })
        );
        expect(firstWrite.status).to.equal("completed");

        const secondWrite = await writer.writeBatch(
            "Patient",
            [
                {
                    _id: documentId,
                    id: "patient-1",
                    resourceType: "Patient",
                    active: false,
                    name: [{ family: "Smith" }]
                }
            ],
            writeContext({ batchId: "batch-second" })
        );
        expect(secondWrite.status).to.equal("completed");

        const stored = await connection.db.collection("Patient").findOne({ _id: documentId });
        expect(String(stored._id)).to.equal(String(documentId));
        expect(stored.active).to.equal(false);
        expect(stored.name).to.deep.equal([{ family: "Smith" }]);
    });

    it("does not trigger mongoose save hooks", async function () {
        const PatientModel = targetModels.Patient;
        let preSaveHookCalled = false;
        let prototypeSaveCalled = false;

        /** @this {import("mongoose").Document} */
        function preSaveHook() {
            preSaveHookCalled = true;
        }
        PatientModel.schema.pre("save", preSaveHook);
        const originalSave = PatientModel.prototype.save;
        PatientModel.prototype.save = function patchedSave(...args) {
            prototypeSaveCalled = true;
            return originalSave.apply(this, args);
        };

        try {
            const writer = createTargetBatchWriter({
                targetConnection: connection,
                targetModels
            });
            const result = await writer.writeBatch(
                "Patient",
                [
                    {
                        _id: new ObjectId(),
                        id: "patient-1",
                        resourceType: "Patient",
                        active: true
                    }
                ],
                writeContext()
            );

            expect(result.status).to.equal("completed");
            expect(preSaveHookCalled).to.equal(false);
            expect(prototypeSaveCalled).to.equal(false);
        } finally {
            PatientModel.prototype.save = originalSave;
            PatientModel.schema.remove("save", preSaveHook);
        }
    });

    it("returns skipped for empty batches", async function () {
        const writer = createTargetBatchWriter({
            targetConnection: connection,
            targetModels
        });
        const result = await writer.writeBatch("Patient", [], writeContext());

        validateMigrationBatchResult(result);
        expect(result).to.deep.include({
            batchId: "batch-1",
            status: "skipped",
            sourceCount: 0,
            targetCount: 0
        });
        expect(result.errors).to.deep.equal([]);

        const count = await connection.db.collection("Patient").countDocuments();
        expect(count).to.equal(0);
    });

    it("surfaces bulkWrite failures in result.errors", async function () {
        const PatientModel = targetModels.Patient;
        const originalBulkWrite = PatientModel.collection.bulkWrite.bind(PatientModel.collection);
        PatientModel.collection.bulkWrite = async function failingBulkWrite() {
            const error = new Error("bulk write failed");
            error.name = "MongoBulkWriteError";
            error.writeErrors = [
                {
                    errmsg: "duplicate key error",
                    code: 11000
                }
            ];
            throw error;
        };

        try {
            const writer = createTargetBatchWriter({
                targetConnection: connection,
                targetModels
            });
            const result = await writer.writeBatch(
                "Patient",
                [
                    {
                        _id: new ObjectId(),
                        id: "patient-1",
                        resourceType: "Patient"
                    }
                ],
                writeContext()
            );

            validateMigrationBatchResult(result);
            expect(result.status).to.equal("failed");
            expect(result.sourceCount).to.equal(1);
            expect(result.targetCount).to.equal(0);
            expect(result.errors).to.deep.equal([
                {
                    message: "duplicate key error",
                    code: "11000"
                }
            ]);
        } finally {
            PatientModel.collection.bulkWrite = originalBulkWrite;
        }
    });
});
