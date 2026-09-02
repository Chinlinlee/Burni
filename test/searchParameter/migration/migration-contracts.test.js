require("module-alias/register");

const fs = require("fs");
const os = require("os");
const path = require("path");
const { expect } = require("chai");
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
    validateCheckpointRecord
} = migrationContracts;

const FACTORY_EXPORTS = [
    "createSourceReader",
    "createCatalogSourceIterator",
    "createDocumentTransformer",
    "createTargetBatchWriter",
    "createCheckpointWriter",
    "createAuditWriter"
];

function baseRunIdentity(overrides = {}) {
    return {
        runId: "run-1",
        sourceDatabaseIdentity: "source-db",
        targetDatabaseIdentity: "target-db",
        ...overrides
    };
}

describe("migration contracts", function () {
    it("exports validators from migrationContracts and dualDatabaseOperator from searchParameter index", function () {
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
            "validateCheckpointRecord"
        ]) {
            expect(migrationContracts).to.have.property(exportName);
        }

        for (const exportName of FACTORY_EXPORTS) {
            expect(migrationContracts).to.not.have.property(exportName);
        }

        const searchParameter = require("@models/FHIR/searchParameter");
        expect(searchParameter.migration).to.have.property("migrationContracts");
        expect(searchParameter.migration.migrationContracts).to.equal(migrationContracts);
        expect(searchParameter.migration).to.have.property("dualDatabaseOperator");
        expect(searchParameter.migration).to.not.have.property("streamingMigration");
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
});
