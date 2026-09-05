require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const {
    dropMongoTestDatabase,
    startMongoMemory,
    stopMongoMemory
} = require("../../../support/mongo-memory");
const {
    discoverModelFilesForCatalog,
    registerDiscoveredModels,
    disableAutomaticSchemaProvisioning
} = require("@models/mongodb/connector");
const { buildModelCatalog } = require("@models/mongodb/provisioning/modelCatalog");
const {
    computeManifestChecksumValue,
    generateDesiredManifest
} = require("@models/mongodb/provisioning/desiredManifest");
const { createManifestChecksum, INDEX_SOURCES } = require("@models/mongodb/provisioning/contracts");
const { HISTORY_VERSION_LOOKUP_NAME } = require("@models/mongodb/provisioning/serviceIndexes");
const { createMongoDdlClientFromConnection } = require("@models/mongodb/provisioning/mongoDdlClient");
const {
    provisionMongoDatabase,
    verifyMongoProvisioning
} = require("@models/mongodb/provisioning/provisioningService");
const { runLockedMongoProvisioning } = require("@models/mongodb/provisioning/provisioningRun");
const { createProvisioningLockStore } = require("@models/mongodb/provisioning/provisioningLock");
const { createProvisioningStateStore } = require("@models/mongodb/provisioning/provisioningState");
const { PROVISIONING_RUN_STATUS } = require("@models/mongodb/provisioning/contracts");
const { ensureControlPlaneOnConnection } = require("@models/mongodb/provisioning/controlPlaneModels");

const FIXTURE_CATALOG = ["Patient", "SearchParameter"];
const FIXED_GENERATED_AT = "2026-09-05T00:00:00.000Z";

/**
 * @param {Record<string, import("mongoose").Model>} modelMap
 * @param {ReturnType<typeof discoverModelFilesForCatalog>} discovered
 * @returns {import("@models/mongodb/provisioning/types").DesiredManifest}
 */
function buildFixtureIntegrationManifest(modelMap, discovered) {
    const full = generateDesiredManifest(modelMap, {
        catalog: buildModelCatalog({
            resourceCatalog: FIXTURE_CATALOG,
            discovered
        }),
        generatedAt: FIXED_GENERATED_AT
    });
    const collectionNames = new Set(full.collections.map((entry) => entry.collection));
    const derivedIndexes = full.derivedIndexes.filter((entry) =>
        collectionNames.has(entry.collection)
    );
    const manifest = {
        ...full,
        derivedIndexes,
        counts: {
            ...full.counts,
            derivedIndexes: derivedIndexes.length
        }
    };
    manifest.checksum = createManifestChecksum(computeManifestChecksumValue(manifest));
    return manifest;
}

/**
 * @param {import("mongoose").Connection} connection
 */
function registerFixtureModels(connection) {
    disableAutomaticSchemaProvisioning();
    const discovered = discoverModelFilesForCatalog(FIXTURE_CATALOG, true);
    /** @type {Record<string, import("mongoose").Model>} */
    const modelMap = {};
    registerDiscoveredModels(discovered, modelMap, connection);
    return { modelMap, discovered };
}

describe("MongoDB provisioning integration", function () {
    this.timeout(180000);

    /** @type {Record<string, import("mongoose").Model>} */
    let modelMap;
    /** @type {ReturnType<typeof discoverModelFilesForCatalog>} */
    let discovered;
    /** @type {import("@models/mongodb/provisioning/types").DesiredManifest} */
    let manifest;

    before(async function () {
        await startMongoMemory();
        const registered = registerFixtureModels(mongoose.connection);
        modelMap = registered.modelMap;
        discovered = registered.discovered;
        manifest = buildFixtureIntegrationManifest(modelMap, discovered);
    });

    after(async function () {
        await dropMongoTestDatabase();
        await stopMongoMemory();
    });

    it("creates fixture collections and indexes visible through listCollections and listIndexes", async function () {
        const ddlClient = createMongoDdlClientFromConnection(mongoose.connection);

        const provisioned = await provisionMongoDatabase({
            manifest,
            ddlClient,
            skipTemporalValidation: true
        });

        expect(provisioned.summary.collectionsCreated).to.be.greaterThan(0);
        expect(provisioned.summary.indexesCreated).to.be.greaterThan(0);

        const collectionNames = await ddlClient.listCollectionNames();
        for (const entry of manifest.collections) {
            expect(collectionNames).to.include(entry.collection);
        }

        const historyIndexes = await ddlClient.listIndexes("Patient_history");
        const historyCompound = historyIndexes.find(
            (entry) => entry.name === HISTORY_VERSION_LOOKUP_NAME
        );
        expect(historyCompound).to.exist;
        expect(historyCompound.key).to.deep.equal({
            id: 1,
            "meta.versionId": -1
        });

        const patientTemporal = manifest.derivedIndexes.find(
            (entry) => entry.collection === "Patient" && entry.source === INDEX_SOURCES.TEMPORAL
        );
        expect(patientTemporal).to.exist;

        const patientIndexes = await ddlClient.listIndexes("Patient");
        const createdTemporal = patientIndexes.find(
            (entry) => entry.name === patientTemporal.name
        );
        expect(createdTemporal).to.exist;
        expect(createdTemporal.key).to.deep.equal(patientTemporal.key);
        expect(patientTemporal.name.startsWith("fhir_temporal_")).to.equal(true);

        const verified = await verifyMongoProvisioning({
            manifest,
            ddlClient,
            skipTemporalValidation: true
        });
        expect(verified.verified).to.equal(true);
    });

    it("treats rerun provisioning as idempotent against real MongoDB", async function () {
        const ddlClient = createMongoDdlClientFromConnection(mongoose.connection);
        const rerun = await provisionMongoDatabase({
            manifest,
            ddlClient,
            skipTemporalValidation: true
        });

        expect(rerun.summary.collectionsCreated).to.equal(0);
        expect(rerun.summary.indexesCreated).to.equal(0);
        expect(rerun.verified).to.equal(true);
    });

    it("runs locked provisioning against real control-plane collections", async function () {
        const ddlClient = createMongoDdlClientFromConnection(mongoose.connection);
        const { lockModel, stateModel } = await ensureControlPlaneOnConnection(mongoose.connection);

        const result = await runLockedMongoProvisioning({
            connection: mongoose.connection,
            manifest,
            ddlClient,
            lockStore: createProvisioningLockStore(lockModel),
            stateStore: createProvisioningStateStore(stateModel),
            ownerId: "integration-runner",
            runId: "integration-locked-run",
            skipTemporalValidation: true
        });

        expect(result.status).to.equal(PROVISIONING_RUN_STATUS.SUCCEEDED);
        expect(result.state?.manifestChecksum).to.equal(manifest.checksum.value);
    });
});
