require("module-alias/register");

const { expect } = require("chai");
const { ObjectId } = require("mongodb");
const {
    INDEX_RECONCILE_STATUS
} = require("@models/mongodb/provisioning/contracts");
const { buildModelCatalog } = require("@models/mongodb/provisioning/modelCatalog");
const {
    discoverModelFilesForCatalog,
    registerDiscoveredModels,
    disableAutomaticSchemaProvisioning
} = require("@models/mongodb/connector");
const {
    createInMemoryIdentityAuditClient
} = require("@models/mongodb/provisioning/identityAuditClient");
const {
    auditDuplicateResourceIds,
    evaluateCleanAuditGate,
    runExplicitUniqueIdIndexMigration,
    summarizeDuplicateGroups,
    IDENTITY_MIGRATION_STATUS
} = require("@models/mongodb/provisioning/identityAuditService");
const {
    buildCreateIndexOptions,
    reconcileIndexes
} = require("@models/mongodb/provisioning/indexReconciler");
const { createBaselineIndexContract, INDEX_SOURCES } = require("@models/mongodb/provisioning/contracts");
const { buildBaselineIndexIdentity } = require("@models/mongodb/provisioning/indexIdentity");
const { createDdlClient } = require("@models/mongodb/provisioning/mongoDdlClient");
const { provisionMongoDatabase } = require("@models/mongodb/provisioning/provisioningService");
const { generateDesiredManifest } = require("@models/mongodb/provisioning/desiredManifest");
const {
    runMongoAuditIdCommand,
    EXIT_SUCCESS,
    EXIT_AUDIT_FAILED
} = require("@models/mongodb/provisioning/operationalCommands");
const mongoose = require("mongoose");

const FIXTURE_CATALOG = ["Patient", "SearchParameter"];

function buildFixtureCatalog() {
    const discovered = discoverModelFilesForCatalog(FIXTURE_CATALOG, true);
    return buildModelCatalog({
        resourceCatalog: FIXTURE_CATALOG,
        discovered
    });
}

function buildFixtureManifest() {
    disableAutomaticSchemaProvisioning();
    const connection = mongoose.createConnection();
    const discovered = discoverModelFilesForCatalog(FIXTURE_CATALOG, true);
    /** @type {Record<string, import("mongoose").Model>} */
    const modelMap = {};
    registerDiscoveredModels(discovered, modelMap, connection);
    const manifest = generateDesiredManifest(modelMap, {
        catalog: buildFixtureCatalog(),
        generatedAt: "2026-09-05T00:00:00.000Z",
        skipTemporalValidation: true
    });
    connection.close();
    return manifest;
}

describe("MongoDB identity duplicate audit", function () {
    it("groups duplicate documents by collection, resource type, and id", async function () {
        const catalog = buildFixtureCatalog();
        const patientId = new ObjectId();
        const patientDuplicateId = new ObjectId();
        const historyId = new ObjectId();
        const historyDuplicateId = new ObjectId();

        const auditClient = createInMemoryIdentityAuditClient({
            Patient: [
                {
                    _id: patientId,
                    id: "patient-1",
                    resourceType: "Patient",
                    meta: { versionId: "1" }
                },
                {
                    _id: patientDuplicateId,
                    id: "patient-1",
                    resourceType: "Patient",
                    meta: { versionId: "2" }
                }
            ],
            Patient_history: [
                {
                    _id: historyId,
                    id: "patient-1",
                    resourceType: "Patient",
                    meta: { versionId: "1" }
                },
                {
                    _id: historyDuplicateId,
                    id: "patient-1",
                    resourceType: "Patient",
                    meta: { versionId: "2" }
                },
                {
                    _id: new ObjectId(),
                    id: "patient-1",
                    resourceType: "Patient",
                    meta: { versionId: "3" }
                }
            ],
            SearchParameter: [],
            SearchParameter_history: []
        });

        const report = await auditDuplicateResourceIds({
            auditClient,
            catalog
        });

        expect(report.hasDuplicates).to.equal(true);
        expect(report.clean).to.equal(false);
        expect(report.duplicates).to.have.length(2);

        const patientGroup = report.duplicates.find((entry) => entry.collection === "Patient");
        const historyGroup = report.duplicates.find(
            (entry) => entry.collection === "Patient_history"
        );

        expect(patientGroup).to.include({
            collection: "Patient",
            resourceType: "Patient",
            modelKind: "resource",
            id: "patient-1",
            count: 2
        });
        expect(patientGroup.documents).to.have.length(2);
        expect(patientGroup.documents.map((entry) => entry.objectId)).to.include(
            String(patientId)
        );
        expect(patientGroup.documents.map((entry) => entry.objectId)).to.include(
            String(patientDuplicateId)
        );

        expect(historyGroup).to.include({
            collection: "Patient_history",
            resourceType: "Patient",
            modelKind: "history",
            id: "patient-1",
            count: 3
        });
        expect(report.summary.byCollection.Patient).to.deep.equal({
            duplicateIds: 1,
            duplicateDocuments: 1
        });
        expect(report.summary.byCollection.Patient_history).to.deep.equal({
            duplicateIds: 1,
            duplicateDocuments: 2
        });
        expect(summarizeDuplicateGroups(report.duplicates)).to.deep.equal(report.summary);
        expect(auditClient.calls.aggregate).to.have.length(4);
        expect(auditClient.calls.aggregate.every((call) => call.pipeline.length > 0)).to.equal(
            true
        );
    });

    it("returns a clean audit report when no duplicate ids exist", async function () {
        const catalog = buildFixtureCatalog();
        const auditClient = createInMemoryIdentityAuditClient({
            Patient: [
                {
                    _id: new ObjectId(),
                    id: "patient-1",
                    resourceType: "Patient",
                    meta: { versionId: "1" }
                }
            ],
            Patient_history: [
                {
                    _id: new ObjectId(),
                    id: "patient-1",
                    resourceType: "Patient",
                    meta: { versionId: "1" }
                },
                {
                    _id: new ObjectId(),
                    id: "patient-2",
                    resourceType: "Patient",
                    meta: { versionId: "1" }
                }
            ]
        });

        const report = await auditDuplicateResourceIds({
            auditClient,
            catalog
        });
        const gate = evaluateCleanAuditGate(report);

        expect(report.hasDuplicates).to.equal(false);
        expect(report.clean).to.equal(true);
        expect(report.duplicates).to.have.length(0);
        expect(gate.allowed).to.equal(true);
        expect(gate.clean).to.equal(true);
    });

    it("does not modify collection data during duplicate audit", async function () {
        const catalog = buildFixtureCatalog();
        const documents = {
            Patient: [
                {
                    _id: new ObjectId(),
                    id: "patient-1",
                    resourceType: "Patient",
                    meta: { versionId: "1" }
                },
                {
                    _id: new ObjectId(),
                    id: "patient-1",
                    resourceType: "Patient",
                    meta: { versionId: "2" }
                }
            ]
        };

        const auditClient = createInMemoryIdentityAuditClient(documents);
        await auditDuplicateResourceIds({ auditClient, catalog });

        expect(documents.Patient).to.have.length(2);
        expect(auditClient.calls.dropIndex || []).to.have.length(0);
    });
});

describe("MongoDB identity unique migration gate", function () {
    it("blocks explicit unique migration when duplicates exist", async function () {
        const catalog = buildFixtureCatalog();
        const auditClient = createInMemoryIdentityAuditClient({
            Patient: [
                {
                    _id: new ObjectId(),
                    id: "patient-1",
                    resourceType: "Patient",
                    meta: { versionId: "1" }
                },
                {
                    _id: new ObjectId(),
                    id: "patient-1",
                    resourceType: "Patient",
                    meta: { versionId: "2" }
                }
            ]
        });
        const ddlClient = createDdlClient({
            listIndexes: async () => [{ key: { _id: 1 }, name: "_id_" }, { key: { id: 1 }, name: "id_1" }]
        });

        const result = await runExplicitUniqueIdIndexMigration({
            auditClient,
            catalog,
            ddlClient
        });

        expect(result.status).to.equal(IDENTITY_MIGRATION_STATUS.BLOCKED);
        expect(result.gate.allowed).to.equal(false);
        expect(result.gate.reason).to.equal("duplicate-resource-ids");
        expect(result.indexesCreated).to.have.length(0);
        expect(ddlClient.calls.createIndex).to.have.length(0);
        expect(ddlClient.calls.dropIndex).to.have.length(0);
    });

    it("allows explicit unique migration only after a clean audit", async function () {
        const catalog = buildFixtureCatalog();
        const auditClient = createInMemoryIdentityAuditClient({
            Patient: [
                {
                    _id: new ObjectId(),
                    id: "patient-1",
                    resourceType: "Patient",
                    meta: { versionId: "1" }
                }
            ],
            Patient_history: [
                {
                    _id: new ObjectId(),
                    id: "patient-1",
                    resourceType: "Patient",
                    meta: { versionId: "1" }
                }
            ],
            SearchParameter: [],
            SearchParameter_history: []
        });

        /** @type {Record<string, Record<string, unknown>[]>} */
        const indexesByCollection = {
            Patient: [{ key: { _id: 1 }, name: "_id_" }, { key: { id: 1 }, name: "id_1" }],
            Patient_history: [{ key: { _id: 1 }, name: "_id_" }, { key: { id: 1 }, name: "id_1" }],
            SearchParameter: [{ key: { _id: 1 }, name: "_id_" }, { key: { id: 1 }, name: "id_1" }],
            SearchParameter_history: [
                { key: { _id: 1 }, name: "_id_" },
                { key: { id: 1 }, name: "id_1" }
            ]
        };

        const ddlClient = createDdlClient({
            listIndexes: async (collectionName) => indexesByCollection[collectionName] || [],
            dropIndex: async (collectionName, indexName) => {
                indexesByCollection[collectionName] = indexesByCollection[collectionName].filter(
                    (entry) => entry.name !== indexName
                );
            },
            createIndex: async (collectionName, key, options) => {
                const bucket = indexesByCollection[collectionName] || [];
                bucket.push({ key, name: options.name, unique: options.unique === true });
                indexesByCollection[collectionName] = bucket;
                return options.name;
            }
        });

        const result = await runExplicitUniqueIdIndexMigration({
            auditClient,
            catalog,
            ddlClient
        });

        expect(result.status).to.equal(IDENTITY_MIGRATION_STATUS.SUCCEEDED);
        expect(result.gate.allowed).to.equal(true);
        expect(result.indexesCreated.length).to.be.greaterThan(0);
        expect(
            result.indexesCreated.every((entry) => entry.status === "created")
        ).to.equal(true);
        expect(
            ddlClient.calls.createIndex.every((call) => call[2]?.unique === true)
        ).to.equal(true);
    });
});

describe("MongoDB provisioning id index safety", function () {
    it("does not create unique id indexes during normal provisioning", function () {
        const desired = createBaselineIndexContract({
            collection: "Patient",
            key: { id: 1 },
            options: { unique: true, background: true },
            name: "id_1",
            source: INDEX_SOURCES.SCHEMA,
            identity: buildBaselineIndexIdentity("Patient", { id: 1 }, { unique: true })
        });

        expect(buildCreateIndexOptions(desired).unique).to.equal(undefined);
    });

    it("preserves existing non-unique id indexes during provisioning", async function () {
        const manifest = buildFixtureManifest();
        const patientBaseline = manifest.baselineIndexes.find(
            (entry) => entry.collection === "Patient" && entry.key.id === 1
        );
        expect(patientBaseline).to.exist;
        expect(patientBaseline.options.unique).to.not.equal(true);

        const ddlClient = createDdlClient({
            listCollectionNames: async () => ["Patient"],
            createCollection: async () => {},
            listIndexes: async () => [
                { key: { _id: 1 }, name: "_id_" },
                { key: patientBaseline.key, name: patientBaseline.name }
            ],
            createIndex: async (collectionName, key, options) => {
                const bucket = [{ key: { _id: 1 }, name: "_id_" }];
                bucket.push({ key, name: options.name, unique: options.unique === true });
                return options.name;
            }
        });

        const provisioned = await provisionMongoDatabase({
            manifest: {
                ...manifest,
                collections: manifest.collections.filter(
                    (entry) => entry.collection === "Patient"
                ),
                baselineIndexes: [patientBaseline],
                derivedIndexes: [],
                counts: {
                    ...manifest.counts,
                    collections: 1,
                    baselineIndexes: 1,
                    derivedIndexes: 0
                }
            },
            ddlClient,
            skipTemporalValidation: true
        });

        const idIndex = provisioned.indexes.find(
            (entry) => entry.collection === "Patient" && entry.name === patientBaseline.name
        );

        expect(idIndex.status).to.equal(INDEX_RECONCILE_STATUS.COMPATIBLE);
        expect(ddlClient.calls.createIndex).to.have.length(0);
    });

    it("creates missing id indexes without unique during provisioning", async function () {
        const manifest = buildFixtureManifest();
        const patientBaseline = manifest.baselineIndexes.find(
            (entry) => entry.collection === "Patient" && entry.key.id === 1
        );

        const ddlClient = createDdlClient({
            listCollectionNames: async () => ["Patient"],
            createCollection: async () => {},
            listIndexes: async () => [{ key: { _id: 1 }, name: "_id_" }],
            createIndex: async () => "id_1"
        });

        await reconcileIndexes([patientBaseline], ddlClient, { mode: "provision" });

        expect(ddlClient.calls.createIndex).to.have.length(1);
        expect(ddlClient.calls.createIndex[0][2].unique).to.equal(undefined);
    });
});

describe("mongodb:audit-id operational command", function () {
    it("returns success for clean audits and nonzero for duplicates", async function () {
        const catalog = buildFixtureCatalog();
        const cleanClient = createInMemoryIdentityAuditClient({
            Patient: [
                {
                    _id: new ObjectId(),
                    id: "patient-1",
                    resourceType: "Patient",
                    meta: { versionId: "1" }
                }
            ]
        });
        const dirtyClient = createInMemoryIdentityAuditClient({
            Patient: [
                {
                    _id: new ObjectId(),
                    id: "patient-1",
                    resourceType: "Patient",
                    meta: { versionId: "1" }
                },
                {
                    _id: new ObjectId(),
                    id: "patient-1",
                    resourceType: "Patient",
                    meta: { versionId: "2" }
                }
            ]
        });

        const cleanResult = await runMongoAuditIdCommand({
            connectOperationalMongo: async () => ({ connection: {}, modelMap: {} }),
            keepConnectionOpen: true,
            catalog,
            auditClient: cleanClient
        });
        const dirtyResult = await runMongoAuditIdCommand({
            connectOperationalMongo: async () => ({ connection: {}, modelMap: {} }),
            keepConnectionOpen: true,
            catalog,
            auditClient: dirtyClient
        });

        expect(cleanResult.exitCode).to.equal(EXIT_SUCCESS);
        expect(cleanResult.report.clean).to.equal(true);
        expect(dirtyResult.exitCode).to.equal(EXIT_AUDIT_FAILED);
        expect(dirtyResult.report.hasDuplicates).to.equal(true);
        expect(dirtyResult.report.duplicates[0].collection).to.equal("Patient");
    });
});
