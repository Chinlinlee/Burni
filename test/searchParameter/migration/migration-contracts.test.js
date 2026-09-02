require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const migrationContracts = require("@models/FHIR/searchParameter/migration/migrationContracts");

const {
    MIGRATION_CONTRACT_INVALID_CONFIG,
    MIGRATION_CONTRACT_INVALID_SHAPE,
    MIGRATION_CONTRACT_NOT_IMPLEMENTED,
    MIGRATION_SOURCE_KINDS,
    MIGRATION_BATCH_STATUSES,
    CHECKPOINT_STATUSES,
    TEMPORAL_TYPES,
    MigrationContractError,
    validateMigrationRunIdentity,
    validateMigrationSourceDescriptor,
    validateMigrationBatchBoundary,
    validateMigrationBatchResult,
    validateAuditRecord,
    validateCheckpointRecord,
    createSourceReader,
    createDocumentTransformer,
    createTargetBatchWriter,
    createCheckpointWriter,
    createAuditWriter
} = migrationContracts;

function fakeConnection() {
    const mockModel = {
        async findOne() {
            return null;
        },
        async findOneAndUpdate() {
            return {};
        },
        find() {
            return {
                sort() {
                    return {
                        async lean() {
                            return [];
                        }
                    };
                }
            };
        }
    };

    return {
        Schema: mongoose.Schema,
        base: mongoose,
        models: {},
        model() {
            return mockModel;
        },
        db: {}
    };
}

function baseRunIdentity(overrides = {}) {
    return {
        runId: "run-1",
        sourceDatabaseIdentity: "source-db",
        targetDatabaseIdentity: "target-db",
        ...overrides
    };
}

describe("migration contracts", function () {
    it("exports contract surface from migrationContracts and searchParameter index", function () {
        expect(MIGRATION_CONTRACT_INVALID_CONFIG).to.equal("MIGRATION_CONTRACT_INVALID_CONFIG");
        expect(MIGRATION_CONTRACT_INVALID_SHAPE).to.equal("MIGRATION_CONTRACT_INVALID_SHAPE");
        expect(MIGRATION_CONTRACT_NOT_IMPLEMENTED).to.equal("MIGRATION_CONTRACT_NOT_IMPLEMENTED");
        expect(MIGRATION_SOURCE_KINDS).to.deep.equal(["resource", "history"]);
        expect(MIGRATION_BATCH_STATUSES).to.deep.equal(["completed", "failed", "skipped"]);
        expect(CHECKPOINT_STATUSES).to.deep.equal(["pending", "started", "completed", "failed"]);
        expect(TEMPORAL_TYPES).to.deep.equal(["date", "dateTime", "instant"]);

        for (const exportName of [
            "MigrationContractError",
            "validateMigrationRunIdentity",
            "validateMigrationSourceDescriptor",
            "validateMigrationBatchBoundary",
            "validateMigrationBatchResult",
            "validateAuditRecord",
            "validateCheckpointRecord",
            "createSourceReader",
            "createDocumentTransformer",
            "createTargetBatchWriter",
            "createCheckpointWriter",
            "createAuditWriter"
        ]) {
            expect(migrationContracts).to.have.property(exportName);
        }

        const searchParameter = require("@models/FHIR/searchParameter");
        expect(searchParameter.migration).to.have.property("migrationContracts");
        expect(searchParameter.migration.migrationContracts).to.equal(migrationContracts);
    });

    describe("factory config validation", function () {
        it("rejects missing sourceConnection for createSourceReader", function () {
            expect(() => createSourceReader({})).to.throw(
                MigrationContractError,
                /sourceConnection/
            );
            try {
                createSourceReader({});
            } catch (error) {
                expect(error.code).to.equal(MIGRATION_CONTRACT_INVALID_CONFIG);
            }
        });

        it("rejects missing run identity fields for createDocumentTransformer", function () {
            expect(() => createDocumentTransformer({})).to.throw(
                MigrationContractError,
                /runId/
            );
            expect(() =>
                createDocumentTransformer({
                    runId: "run-1",
                    sourceDatabaseIdentity: "source-db"
                })
            ).to.throw(MigrationContractError, /targetDatabaseIdentity/);
        });

        it("accepts runIdentity object for createDocumentTransformer", function () {
            const transformer = createDocumentTransformer({
                runIdentity: baseRunIdentity()
            });
            expect(transformer).to.have.property("transformDocument").that.is.a("function");
        });

        it("rejects missing targetConnection and runId for createTargetBatchWriter", function () {
            expect(() => createTargetBatchWriter({})).to.throw(
                MigrationContractError,
                /targetConnection/
            );
            expect(() =>
                createTargetBatchWriter({ targetConnection: fakeConnection() })
            ).to.throw(MigrationContractError, /runId/);
        });

        it("rejects missing targetConnection and run identity for createCheckpointWriter", function () {
            expect(() => createCheckpointWriter({})).to.throw(
                MigrationContractError,
                /targetConnection/
            );
            expect(() =>
                createCheckpointWriter({ targetConnection: fakeConnection() })
            ).to.throw(MigrationContractError, /runId/);
        });

        it("rejects missing runId and artifactPath for createAuditWriter", function () {
            expect(() => createAuditWriter({})).to.throw(MigrationContractError, /runId/);
            expect(() => createAuditWriter({ runId: "run-1" })).to.throw(
                MigrationContractError,
                /artifactPath/
            );
        });
    });

    describe("contract shape validation", function () {
        it("validates MigrationRunIdentity", function () {
            expect(() => validateMigrationRunIdentity(null)).to.throw(
                MigrationContractError,
                /runIdentity/
            );
            validateMigrationRunIdentity(baseRunIdentity());
        });

        it("validates MigrationSourceDescriptor", function () {
            validateMigrationSourceDescriptor({
                resource: "Patient",
                model: "Patient",
                kind: "resource",
                collectionName: "patients"
            });
            expect(() =>
                validateMigrationSourceDescriptor({
                    resource: "Patient",
                    model: "Patient",
                    kind: "unknown",
                    collectionName: "patients"
                })
            ).to.throw(MigrationContractError, /kind/);
        });

        it("validates MigrationBatchBoundary", function () {
            validateMigrationBatchBoundary({
                batchId: "batch-1",
                collection: "patients",
                startCursor: null,
                resumeToken: "token-1",
                documentCount: 2,
                sourceIds: ["id-1", "id-2"]
            });
            expect(() =>
                validateMigrationBatchBoundary({
                    batchId: "batch-1",
                    collection: "patients",
                    documentCount: -1,
                    sourceIds: []
                })
            ).to.throw(MigrationContractError, /documentCount/);
        });

        it("validates MigrationBatchResult", function () {
            validateMigrationBatchResult({
                batchId: "batch-1",
                status: "completed",
                sourceCount: 2,
                targetCount: 2,
                errors: []
            });
            expect(() =>
                validateMigrationBatchResult({
                    batchId: "batch-1",
                    status: "pending",
                    sourceCount: 0,
                    targetCount: 0,
                    errors: []
                })
            ).to.throw(MigrationContractError, /status/);
        });

        it("validates AuditRecord", function () {
            validateAuditRecord({
                sourceDatabaseIdentity: "source-db",
                sourceCollection: "patients",
                sourceDocumentId: "doc-1",
                fhirPath: "birthDate",
                temporalType: "date",
                policy: "utc-calendar-day-lossy",
                originalValue: new Date("2020-01-15T00:00:00.000Z"),
                generatedValue: { value: "2020-01-15", precision: "day" }
            });
            expect(() =>
                validateAuditRecord({
                    sourceDatabaseIdentity: "source-db",
                    sourceCollection: "patients",
                    sourceDocumentId: "doc-1",
                    fhirPath: "birthDate",
                    temporalType: "time",
                    policy: "utc-calendar-day-lossy",
                    originalValue: "2020-01",
                    generatedValue: {}
                })
            ).to.throw(MigrationContractError, /temporalType/);
        });

        it("validates CheckpointRecord", function () {
            validateCheckpointRecord({
                runId: "run-1",
                collection: "patients",
                batchId: "batch-1",
                status: "completed",
                counts: { sourceCount: 10, targetCount: 10 }
            });
            expect(() =>
                validateCheckpointRecord({
                    runId: "run-1",
                    collection: "patients",
                    batchId: "batch-1",
                    status: "completed",
                    counts: { sourceCount: -1 }
                })
            ).to.throw(MigrationContractError, /counts\.sourceCount/);
        });
    });

    describe("stub factory behavior", function () {
        it("returns checkpoint writer surface while target writer handles empty batches", async function () {
            const source = {
                resource: "Patient",
                model: "Patient",
                kind: "resource",
                collectionName: "patients"
            };
            const reader = createSourceReader({ sourceConnection: fakeConnection() });
            try {
                await reader.readBatch(source);
                expect.fail("readBatch should throw without a connected db.collection");
            } catch (error) {
                expect(error).to.be.instanceOf(Error);
                expect(error.message).to.match(/db\.collection/);
            }
            await reader.close();

            const transformer = createDocumentTransformer({ runIdentity: baseRunIdentity() });
            const result = transformer.transformDocument(
                {
                    _id: "doc-1",
                    id: "doc-1",
                    resourceType: "Patient",
                    birthDate: "1995"
                },
                { runIdentity: baseRunIdentity(), source, batchId: "batch-1" }
            );
            expect(result.document.birthDate).to.have.property("precision", "year");
            expect(result.auditEntries).to.have.length(1);

            const targetWriter = createTargetBatchWriter({
                targetConnection: fakeConnection(),
                runId: "run-1",
                targetModels: {}
            });
            const skipped = await targetWriter.writeBatch("patients", [], {
                runIdentity: baseRunIdentity(),
                source,
                batchId: "batch-1"
            });
            validateMigrationBatchResult(skipped);
            expect(skipped.status).to.equal("skipped");

            const checkpointWriter = createCheckpointWriter({
                targetConnection: fakeConnection(),
                runIdentity: baseRunIdentity()
            });
            expect(checkpointWriter.getCheckpoint).to.be.a("function");
            expect(checkpointWriter.markBatchStarted).to.be.a("function");
            expect(checkpointWriter.markBatchCompleted).to.be.a("function");
            expect(checkpointWriter.markBatchFailed).to.be.a("function");
            expect(checkpointWriter.listCompletedBatches).to.be.a("function");
        });

        it("provides minimal audit writer no-op append and flush", async function () {
            const auditWriter = createAuditWriter({
                runId: "run-1",
                artifactPath: "/tmp/audit.jsonl"
            });
            expect(auditWriter.getArtifactPath()).to.equal("/tmp/audit.jsonl");
            await auditWriter.append([
                {
                    sourceDatabaseIdentity: "source-db",
                    sourceCollection: "patients",
                    sourceDocumentId: "doc-1",
                    fhirPath: "birthDate",
                    temporalType: "date",
                    policy: "utc-calendar-day-lossy",
                    originalValue: "2020-01",
                    generatedValue: { value: "2020-01", precision: "month" }
                }
            ]);
            await auditWriter.flush();
        });

        it("accepts a real mongoose connection for source and target factories", function () {
            const connection = mongoose.createConnection();
            expect(() =>
                createSourceReader({ sourceConnection: connection })
            ).to.not.throw();
            expect(() =>
                createTargetBatchWriter({
                    targetConnection: connection,
                    runId: "run-1"
                })
            ).to.not.throw();
            connection.close().catch(() => {});
        });
    });
});
