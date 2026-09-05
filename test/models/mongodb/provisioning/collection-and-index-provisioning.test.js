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
const { createSearchQueryPlan } = require("@models/FHIR/searchParameter/compiler/searchQueryPlan");
const {
    generateTemporalIndexManifestWithDiagnostics
} = require("@models/FHIR/searchParameter/indexes/indexGenerator");
const { validateTemporalIndexEntryCompatibility } = require("@models/FHIR/searchParameter/indexes/indexCompatibility");
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

    it("creates deterministic search-parameter derived indexes with approved metadata only", async function () {
        const { modelMap, discovered } = registerFixtureModels();
        const manifest = buildFixtureManifest(modelMap, discovered);
        const searchParameterIndex = manifest.derivedIndexes.find(
            (entry) => entry.source === INDEX_SOURCES.SEARCH_PARAMETER
        );
        expect(searchParameterIndex).to.exist;
        expect(searchParameterIndex.name.startsWith("fhir_sp_")).to.equal(true);
        expect(searchParameterIndex.searchParameter.searchType).to.be.a("string");

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
        const createdSearchParameter = createdIndexes.filter(
            (entry) => entry.options.name === searchParameterIndex.name
        );

        expect(createdSearchParameter.length).to.equal(1);
        expect(createdSearchParameter[0].key).to.deep.equal(searchParameterIndex.key);
        expect(provisioned.indexes.some((entry) => entry.name === searchParameterIndex.name)).to.equal(
            true
        );
    });

    it("creates deterministic temporal indexes with approved metadata only", async function () {
        const { modelMap, discovered } = registerFixtureModels();
        const manifest = buildFixtureManifest(modelMap, discovered);
        const temporalIndex = manifest.derivedIndexes.find(
            (entry) => entry.source === INDEX_SOURCES.TEMPORAL
        );
        expect(temporalIndex).to.exist;
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

    it("excludes unsafe temporal index shapes from the approved derived manifest", function () {
        const unsafePlan = createSearchQueryPlan({
            resourceType: "CarePlan",
            code: "unsafe-activity-date",
            searchType: "date",
            extractionPaths: [
                {
                    path: "activity.detail.scheduledPeriod",
                    datatype: "Period",
                    arrayPaths: ["activity", "goal"]
                }
            ],
            comparators: ["eq"]
        });
        const unsafeDefinition = {
            canonicalKey: "http://example.org/SearchParameter/unsafe-activity-date::4.0.1",
            effectiveStatus: "active",
            resource: {
                code: "unsafe-activity-date",
                resourceType: "SearchParameter"
            },
            lookupPlans: {
                "CarePlan::unsafe-activity-date": {
                    compilable: true,
                    plan: unsafePlan
                }
            }
        };

        const generated = generateTemporalIndexManifestWithDiagnostics([unsafeDefinition]);
        expect(generated.manifest.indexes).to.have.length(1);

        const unsafeEntry = generated.manifest.indexes[0];
        const compatibility = validateTemporalIndexEntryCompatibility(unsafeEntry);
        expect(compatibility.valid).to.equal(false);
        expect(compatibility.diagnostics.map((entry) => entry.code)).to.include(
            "parallel-multikey-paths"
        );

        /** @type {import("@models/FHIR/searchParameter/indexes/indexManifest").TemporalIndexEntry[]} */
        const approvedEntries = [];
        /** @type {string[]} */
        const pipelineDiagnostics = generated.diagnostics.map((diagnostic) =>
            typeof diagnostic === "string" ? diagnostic : `${diagnostic.code}: ${diagnostic.message}`
        );
        for (const entry of generated.manifest.indexes) {
            const result = validateTemporalIndexEntryCompatibility(entry);
            if (!result.valid) {
                pipelineDiagnostics.push(
                    ...result.diagnostics.map(
                        (diagnostic) => `${diagnostic.code}: ${diagnostic.message}`
                    )
                );
                continue;
            }
            approvedEntries.push(entry);
        }

        expect(approvedEntries).to.deep.equal([]);
        expect(
            pipelineDiagnostics.some((diagnostic) => diagnostic.startsWith("parallel-multikey-paths:"))
        ).to.equal(true);
        expect(
            approvedEntries.every((entry) => validateTemporalIndexEntryCompatibility(entry).valid)
        ).to.equal(true);
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
