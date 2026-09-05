require("module-alias/register");

const { expect } = require("chai");
const {
    INDEX_RECONCILE_STATUS
} = require("@models/mongodb/provisioning/contracts");
const { createDdlClient } = require("@models/mongodb/provisioning/mongoDdlClient");
const {
    discoverModelFilesForCatalog,
    registerDiscoveredModels,
    disableAutomaticSchemaProvisioning
} = require("@models/mongodb/connector");
const { buildModelCatalog } = require("@models/mongodb/provisioning/modelCatalog");
const { generateDesiredManifest } = require("@models/mongodb/provisioning/desiredManifest");
const { verifyMongoProvisioning } = require("@models/mongodb/provisioning/provisioningService");
const {
    buildVerifyReport,
    evaluateManifestIdentityDrift,
    runMongoAuditIdCommand,
    EXIT_SUCCESS,
    EXIT_AUDIT_FAILED
} = require("@models/mongodb/provisioning/operationalCommands");
const {
    createInMemoryIdentityAuditClient
} = require("@models/mongodb/provisioning/identityAuditClient");
const {
    createInMemoryProvisioningStateStore,
    beginProvisioningRun
} = require("@models/mongodb/provisioning/provisioningState");
const mongoose = require("mongoose");

const FIXTURE_CATALOG = ["Patient", "SearchParameter"];

function buildFixtureContext() {
    disableAutomaticSchemaProvisioning();
    const connection = mongoose.createConnection();
    const discovered = discoverModelFilesForCatalog(FIXTURE_CATALOG, true);
    /** @type {Record<string, import("mongoose").Model>} */
    const modelMap = {};
    registerDiscoveredModels(discovered, modelMap, connection);
    const manifest = generateDesiredManifest(modelMap, {
        catalog: buildModelCatalog({
            resourceCatalog: FIXTURE_CATALOG,
            discovered
        }),
        generatedAt: "2026-09-05T00:00:00.000Z",
        skipTemporalValidation: true
    });
    return { connection, modelMap, manifest, discovered };
}

describe("mongodb provisioning operational commands", function () {
    /** @type {import("mongoose").Connection[]} */
    const openConnections = [];

    afterEach(async function () {
        for (const connection of openConnections.splice(0)) {
            await connection.close();
        }
    });

    it("verifyMongoProvisioning does not execute collection or index DDL", async function () {
        const { manifest } = buildFixtureContext();
        const ddlClient = createDdlClient({
            listCollectionNames: async () => ["Patient"],
            listIndexes: async () => [{ key: { _id: 1 }, name: "_id_" }]
        });

        await verifyMongoProvisioning({
            manifest,
            ddlClient,
            skipTemporalValidation: true
        });

        expect(ddlClient.calls.createCollection).to.have.length(0);
        expect(ddlClient.calls.createIndex).to.have.length(0);
        expect(ddlClient.calls.listCollectionNames.length).to.be.greaterThan(0);
        expect(ddlClient.calls.listIndexes.length).to.be.greaterThan(0);
    });

    it("buildVerifyReport groups missing, extra, and mismatch indexes", function () {
        const report = buildVerifyReport({
            reconcile: {
                manifestChecksum: "abc",
                manifestVersion: 1,
                verified: false,
                collections: [],
                indexes: [
                    {
                        collection: "Patient",
                        name: "missing_idx",
                        identity: "missing",
                        status: INDEX_RECONCILE_STATUS.MISSING
                    },
                    {
                        collection: "Patient",
                        name: "extra_idx",
                        identity: "extra",
                        status: INDEX_RECONCILE_STATUS.EXTRA
                    },
                    {
                        collection: "Patient",
                        name: "mismatch_idx",
                        identity: "mismatch",
                        status: INDEX_RECONCILE_STATUS.MISMATCH
                    }
                ],
                summary: {},
                errors: ["Patient.missing_idx: index missing"]
            },
            manifestIdentityDrift: {
                drifted: false,
                current: { manifestChecksum: "abc", manifestVersion: 1 }
            }
        });

        expect(report.indexes.missing).to.have.length(1);
        expect(report.indexes.extra).to.have.length(1);
        expect(report.indexes.mismatch).to.have.length(1);
        expect(report.verified).to.equal(false);
    });

    it("evaluateManifestIdentityDrift detects checksum and version drift", async function () {
        const stateStore = createInMemoryProvisioningStateStore();
        await beginProvisioningRun(stateStore, {
            databaseIdentity: "burni-test",
            runId: "run-1",
            manifestChecksum: "old-checksum",
            manifestVersion: 1
        });

        const drift = await evaluateManifestIdentityDrift(
            {
                checksum: { value: "new-checksum" },
                version: 2
            },
            stateStore,
            "burni-test"
        );

        expect(drift.drifted).to.equal(true);
        expect(drift.persisted?.manifestChecksum).to.equal("old-checksum");
        expect(drift.current.manifestChecksum).to.equal("new-checksum");
    });

    it("runMongoAuditIdCommand reports clean audits through the operational seam", async function () {
        const discovered = discoverModelFilesForCatalog(FIXTURE_CATALOG, true);
        const catalog = buildModelCatalog({
            resourceCatalog: FIXTURE_CATALOG,
            discovered
        });
        const auditClient = createInMemoryIdentityAuditClient({
            Patient: [
                {
                    _id: "patient-1",
                    id: "patient-1",
                    resourceType: "Patient",
                    meta: { versionId: "1" }
                }
            ]
        });

        const result = await runMongoAuditIdCommand({
            connectOperationalMongo: async () => ({ connection: {}, modelMap: {} }),
            keepConnectionOpen: true,
            catalog,
            auditClient
        });

        expect(result.exitCode).to.equal(EXIT_SUCCESS);
        expect(result.report.available).to.equal(true);
        expect(result.report.clean).to.equal(true);
    });

    it("runMongoAuditIdCommand returns nonzero when duplicates are present", async function () {
        const discovered = discoverModelFilesForCatalog(FIXTURE_CATALOG, true);
        const catalog = buildModelCatalog({
            resourceCatalog: FIXTURE_CATALOG,
            discovered
        });
        const auditClient = createInMemoryIdentityAuditClient({
            Patient: [
                {
                    _id: "patient-1",
                    id: "patient-1",
                    resourceType: "Patient",
                    meta: { versionId: "1" }
                },
                {
                    _id: "patient-2",
                    id: "patient-1",
                    resourceType: "Patient",
                    meta: { versionId: "2" }
                }
            ]
        });

        const result = await runMongoAuditIdCommand({
            connectOperationalMongo: async () => ({ connection: {}, modelMap: {} }),
            keepConnectionOpen: true,
            catalog,
            auditClient
        });

        expect(result.exitCode).to.equal(EXIT_AUDIT_FAILED);
        expect(result.report.hasDuplicates).to.equal(true);
    });
});
