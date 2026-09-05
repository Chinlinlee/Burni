require("module-alias/register");

const { expect } = require("chai");
const {
    COLLECTION_RECONCILE_STATUS,
    INDEX_RECONCILE_STATUS,
    INDEX_DRIFT_TYPES,
    INDEX_SOURCES
} = require("@models/mongodb/provisioning/contracts");
const { buildModelCatalog } = require("@models/mongodb/provisioning/modelCatalog");
const {
    provisionCollections,
    summarizeCollectionResults
} = require("@models/mongodb/provisioning/collectionProvisioner");
const {
    createDdlClient
} = require("@models/mongodb/provisioning/mongoDdlClient");
const {
    provisionMongoDatabase,
    verifyMongoProvisioning
} = require("@models/mongodb/provisioning/provisioningService");
const {
    generateDesiredManifest
} = require("@models/mongodb/provisioning/desiredManifest");
const {
    discoverModelFilesForCatalog,
    registerDiscoveredModels,
    disableAutomaticSchemaProvisioning
} = require("@models/mongodb/connector");
const mongoose = require("mongoose");

const FIXTURE_CATALOG = ["Patient", "SearchParameter"];

/** @type {import("mongoose").Connection[]} */
const openConnections = [];

function registerFixtureModels() {
    disableAutomaticSchemaProvisioning();
    const connection = mongoose.createConnection();
    openConnections.push(connection);
    const discovered = discoverModelFilesForCatalog(FIXTURE_CATALOG, true);
    /** @type {Record<string, import("mongoose").Model>} */
    const modelMap = {};
    registerDiscoveredModels(discovered, modelMap, connection);
    return { modelMap, discovered, connection };
}

function buildFixtureManifest(modelMap, discovered) {
    return generateDesiredManifest(modelMap, {
        catalog: buildModelCatalog({
            resourceCatalog: FIXTURE_CATALOG,
            discovered
        }),
        generatedAt: "2026-09-05T00:00:00.000Z"
    });
}

afterEach(async function () {
    while (openConnections.length > 0) {
        const connection = openConnections.pop();
        await connection.close();
    }
});

describe("MongoDB collection provisioning", function () {
    it("creates all catalog collections and treats reruns as already-existing", async function () {
        const catalog = buildModelCatalog({
            resourceCatalog: FIXTURE_CATALOG,
            discovered: discoverModelFilesForCatalog(FIXTURE_CATALOG, true)
        });
        const existing = new Set(["Patient"]);
        const ddlClient = createDdlClient({
            listCollectionNames: async () => [...existing],
            createCollection: async (collectionName) => {
                existing.add(collectionName);
            }
        });

        const first = await provisionCollections(catalog.entries, ddlClient);
        const second = await provisionCollections(catalog.entries, ddlClient);

        expect(
            first.filter((entry) => entry.status === COLLECTION_RECONCILE_STATUS.CREATED).length
        ).to.be.greaterThan(0);
        expect(first.find((entry) => entry.collection === "Patient").status).to.equal(
            COLLECTION_RECONCILE_STATUS.ALREADY_EXISTING
        );
        expect(second.every((entry) => entry.status === COLLECTION_RECONCILE_STATUS.ALREADY_EXISTING))
            .to.equal(true);
        expect(ddlClient.calls.createCollection.length).to.be.greaterThan(0);
    });

    it("reports failed collections without deleting existing collections", async function () {
        const catalog = buildModelCatalog({
            resourceCatalog: FIXTURE_CATALOG,
            discovered: discoverModelFilesForCatalog(FIXTURE_CATALOG, true)
        });
        const ddlClient = createDdlClient({
            listCollectionNames: async () => ["Patient"],
            createCollection: async (collectionName) => {
                if (collectionName === "SearchParameter") {
                    throw new Error("createCollection denied");
                }
            }
        });

        const results = await provisionCollections(catalog.entries, ddlClient);
        const summary = summarizeCollectionResults(results);
        const failed = results.find((entry) => entry.collection === "SearchParameter");

        expect(failed.status).to.equal(COLLECTION_RECONCILE_STATUS.FAILED);
        expect(failed.error).to.include("createCollection denied");
        expect(summary.collectionsFailed).to.equal(1);
        expect(summary.collectionsExisting).to.equal(1);
    });
});

describe("MongoDB provisioning service", function () {
    it("uses explicit DDL for collections and indexes while autoCreate/autoIndex stay disabled", async function () {
        const { modelMap, discovered } = registerFixtureModels();
        const manifest = buildFixtureManifest(modelMap, discovered);
        const existingCollections = new Set(["Patient"]);
        /** @type {Record<string, Record<string, unknown>[]>} */
        const indexesByCollection = {
            Patient: [{ key: { _id: 1 }, name: "_id_" }]
        };

        const ddlClient = createDdlClient({
            listCollectionNames: async () => [...existingCollections],
            createCollection: async (collectionName) => {
                existingCollections.add(collectionName);
            },
            listIndexes: async (collectionName) =>
                indexesByCollection[collectionName] || [{ key: { _id: 1 }, name: "_id_" }],
            createIndex: async (collectionName, key, options) => {
                const bucket = indexesByCollection[collectionName] || [];
                bucket.push({ key, name: options.name, ...options });
                indexesByCollection[collectionName] = bucket;
                return options.name;
            }
        });

        expect(mongoose.get("autoCreate")).to.equal(false);
        expect(mongoose.get("autoIndex")).to.equal(false);

        const provisioned = await provisionMongoDatabase({
            manifest,
            ddlClient,
            skipTemporalValidation: true
        });

        expect(ddlClient.calls.createCollection.length).to.be.greaterThan(0);
        expect(ddlClient.calls.createIndex.length).to.be.greaterThan(0);
        expect(provisioned.summary.indexesCreated).to.be.greaterThan(0);

        const rerun = await provisionMongoDatabase({
            manifest,
            ddlClient,
            skipTemporalValidation: true
        });
        expect(rerun.summary.indexesCreated).to.equal(0);
        expect(
            rerun.indexes.filter((entry) => entry.status === INDEX_RECONCILE_STATUS.COMPATIBLE)
                .length
        ).to.be.greaterThan(0);
    });

    it("classifies compatible, missing, extra, and mismatch indexes without dropping extras", async function () {
        const { modelMap, discovered } = registerFixtureModels();
        const manifest = buildFixtureManifest(modelMap, discovered);
        const patientBaseline = manifest.baselineIndexes.find(
            (entry) => entry.collection === "Patient"
        );
        const patientHistoryBaseline = manifest.baselineIndexes.find(
            (entry) => entry.collection === "Patient_history"
        );

        const ddlClient = createDdlClient({
            listCollectionNames: async () =>
                manifest.collections.map((entry) => entry.collection),
            createCollection: async () => {},
            listIndexes: async (collectionName) => {
                if (collectionName === "Patient") {
                    return [
                        { key: { _id: 1 }, name: "_id_" },
                        { key: patientBaseline.key, name: patientBaseline.name },
                        { key: { legacyField: 1 }, name: "legacy_extra" }
                    ];
                }
                if (collectionName === "Patient_history") {
                    return [
                        { key: { _id: 1 }, name: "_id_" },
                        {
                            key: patientHistoryBaseline.key,
                            name: patientHistoryBaseline.name,
                            unique: true
                        }
                    ];
                }
                return [{ key: { _id: 1 }, name: "_id_" }];
            },
            createIndex: async () => "unused"
        });

        const verified = await verifyMongoProvisioning({
            manifest,
            ddlClient,
            skipTemporalValidation: true
        });

        const patientCompatible = verified.indexes.find(
            (entry) =>
                entry.collection === "Patient" && entry.name === patientBaseline.name
        );
        const patientExtra = verified.indexes.find(
            (entry) => entry.collection === "Patient" && entry.name === "legacy_extra"
        );
        const historyMismatch = verified.indexes.find(
            (entry) =>
                entry.collection === "Patient_history" &&
                entry.name === patientHistoryBaseline.name
        );
        const missingTemporal = verified.indexes.filter(
            (entry) => entry.status === INDEX_RECONCILE_STATUS.MISSING
        );

        expect(patientCompatible.status).to.equal(INDEX_RECONCILE_STATUS.COMPATIBLE);
        expect(patientCompatible.drift.type).to.equal(INDEX_DRIFT_TYPES.COMPATIBLE);
        expect(patientExtra.status).to.equal(INDEX_RECONCILE_STATUS.EXTRA);
        expect(historyMismatch.status).to.equal(INDEX_RECONCILE_STATUS.MISMATCH);
        expect(historyMismatch.drift.type).to.equal(INDEX_DRIFT_TYPES.MISMATCH);
        expect(missingTemporal.length).to.be.greaterThan(0);
        expect(verified.verified).to.equal(false);
        expect(ddlClient.calls.createIndex.length).to.equal(0);
    });

    it("creates deterministic temporal indexes with approved metadata only", async function () {
        const { modelMap, discovered } = registerFixtureModels();
        const manifest = buildFixtureManifest(modelMap, discovered);
        const temporalIndex = manifest.derivedIndexes[0];
        expect(temporalIndex.source).to.equal(INDEX_SOURCES.TEMPORAL);
        expect(temporalIndex.name.startsWith("fhir_temporal_")).to.equal(true);
        expect(temporalIndex.temporal.extractionPath).to.be.a("string");
        expect(temporalIndex.temporal.bsonType).to.be.a("string");

        const existingCollections = new Set(manifest.collections.map((entry) => entry.collection));
        /** @type {Record<string, Record<string, unknown>[]>} */
        const indexesByCollection = {};
        const createdIndexes = [];

        const ddlClient = createDdlClient({
            listCollectionNames: async () => [...existingCollections],
            createCollection: async () => {},
            listIndexes: async (collectionName) =>
                indexesByCollection[collectionName] || [{ key: { _id: 1 }, name: "_id_" }],
            createIndex: async (collectionName, key, options) => {
                createdIndexes.push({ collectionName, key, options });
                const bucket = indexesByCollection[collectionName] || [
                    { key: { _id: 1 }, name: "_id_" }
                ];
                bucket.push({ key, name: options.name, background: true });
                indexesByCollection[collectionName] = bucket;
                return options.name;
            }
        });

        const provisioned = await provisionMongoDatabase({ manifest, ddlClient });
        const createdTemporal = createdIndexes.filter(
            (entry) => entry.options.name === temporalIndex.name
        );

        expect(createdTemporal.length).to.equal(1);
        expect(createdTemporal[0].key).to.deep.equal(temporalIndex.key);
        expect(provisioned.indexes.some((entry) => entry.name === temporalIndex.name)).to.equal(
            true
        );
    });

    it("does not auto-change an existing non-unique id index to unique", async function () {
        const { modelMap, discovered } = registerFixtureModels();
        const manifest = buildFixtureManifest(modelMap, discovered);
        const patientBaseline = manifest.baselineIndexes.find(
            (entry) => entry.collection === "Patient"
        );

        const ddlClient = createDdlClient({
            listCollectionNames: async () => ["Patient"],
            createCollection: async () => {},
            listIndexes: async () => [
                { key: { _id: 1 }, name: "_id_" },
                { key: patientBaseline.key, name: patientBaseline.name, unique: true }
            ],
            createIndex: async () => {
                throw new Error("createIndex should not be called for unique mismatch");
            }
        });

        const verified = await verifyMongoProvisioning({
            manifest: {
                ...manifest,
                baselineIndexes: [patientBaseline],
                derivedIndexes: [],
                counts: {
                    ...manifest.counts,
                    baselineIndexes: 1,
                    derivedIndexes: 0
                }
            },
            ddlClient,
            skipTemporalValidation: true
        });

        expect(verified.indexes[0].status).to.equal(INDEX_RECONCILE_STATUS.MISMATCH);
        expect(ddlClient.calls.createIndex.length).to.equal(0);
    });
});
