require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const {
    discoverModelFilesForCatalog,
    registerDiscoveredModels,
    disableAutomaticSchemaProvisioning
} = require("@models/mongodb/connector");
const { loadResourceCatalog, EXPECTED_RESOURCE_COUNT } = require("../../../support/fhir/resource-catalog");
const {
    MODEL_KINDS,
    INDEX_SOURCES,
    INDEX_DRIFT_TYPES,
    COLLECTION_RECONCILE_STATUS,
    INDEX_RECONCILE_STATUS,
    createCollectionContract,
    createBaselineIndexContract,
    createDerivedIndexContract,
    createManifestChecksum,
    createReconcileResult,
    assertCollectionContract,
    assertBaselineIndexContract,
    assertDerivedIndexContract,
    assertReconcileResult
} = require("@models/mongodb/provisioning/contracts");
const {
    EXPECTED_RESOURCE_COUNT: CATALOG_RESOURCE_COUNT,
    buildModelCatalog
} = require("@models/mongodb/provisioning/modelCatalog");
const {
    HISTORY_VERSION_LOOKUP_NAME,
    collectServiceIndexes
} = require("@models/mongodb/provisioning/serviceIndexes");
const {
    collectSchemaIndexesFromModel
} = require("@models/mongodb/provisioning/schemaIndexCollector");
const {
    collectApprovedTemporalDerivedIndexes
} = require("@models/mongodb/provisioning/temporalIndexAdapter");
const {
    computeManifestChecksumValue,
    generateDesiredManifest
} = require("@models/mongodb/provisioning/desiredManifest");
const { assertApprovedDerivedManifest } = require("@models/mongodb/provisioning/provisioningService");

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

afterEach(async function () {
    while (openConnections.length > 0) {
        const connection = openConnections.pop();
        await connection.close();
    }
});

describe("MongoDB provisioning contracts", function () {
    it("defines stable collection, index, checksum, and reconcile contracts", function () {
        const collection = createCollectionContract({
            collection: "Patient",
            modelName: "Patient",
            modelKind: MODEL_KINDS.RESOURCE,
            resourceType: "Patient"
        });
        assertCollectionContract(collection);

        const baseline = createBaselineIndexContract({
            collection: "Patient",
            key: { id: 1 },
            options: { background: true },
            name: "id_1",
            source: INDEX_SOURCES.SCHEMA,
            identity: '{"collection":"Patient","key":{"id":1},"options":{"background":true}}'
        });
        assertBaselineIndexContract(baseline);

        const derived = createDerivedIndexContract({
            collection: "Patient",
            key: { "birthDate.normalizedStart": 1, "birthDate.normalizedEnd": 1 },
            options: { background: true },
            name: "fhir_temporal_example",
            source: INDEX_SOURCES.TEMPORAL,
            identity: "example-identity",
            temporal: {
                resourceType: "Patient",
                extractionPath: "birthDate",
                datatype: "date",
                indexKind: "date-calendar-boundary",
                bsonType: "string",
                valueShape: "calendar-boundary",
                lookupKeys: ["Patient::birthdate"],
                canonicalKeys: ["http://example.org/SearchParameter/birthdate::4.0.1"]
            }
        });
        assertDerivedIndexContract(derived);

        const checksum = createManifestChecksum("abc123");
        expect(checksum.algorithm).to.equal("sha256");
        expect(checksum.value).to.equal("abc123");

        const reconcile = createReconcileResult({
            manifestChecksum: "abc123",
            manifestVersion: 1,
            verified: false,
            collections: [
                {
                    collection: "Patient",
                    status: COLLECTION_RECONCILE_STATUS.ALREADY_EXISTING
                }
            ],
            indexes: [
                {
                    collection: "Patient",
                    name: "id_1",
                    identity: baseline.identity,
                    status: INDEX_RECONCILE_STATUS.MISSING,
                    drift: {
                        type: INDEX_DRIFT_TYPES.MISSING,
                        message: "index missing"
                    }
                }
            ],
            summary: {
                indexesMissing: 1
            },
            errors: []
        });
        assertReconcileResult(reconcile);
    });
});

describe("MongoDB provisioning model catalog", function () {
    it("aligns resource, history, and static collections with the 146-resource catalog", function () {
        const catalog = buildModelCatalog();
        const resourceCatalog = loadResourceCatalog();

        expect(CATALOG_RESOURCE_COUNT).to.equal(EXPECTED_RESOURCE_COUNT);
        expect(catalog.resourceCount).to.equal(EXPECTED_RESOURCE_COUNT);
        expect(catalog.historyCount).to.equal(EXPECTED_RESOURCE_COUNT);
        expect(catalog.staticCount).to.equal(3);
        expect(catalog.collectionCount).to.equal(EXPECTED_RESOURCE_COUNT * 2 + 3);

        const resourceTypes = catalog.entries
            .filter((entry) => entry.modelKind === MODEL_KINDS.RESOURCE)
            .map((entry) => entry.resourceType);
        expect(resourceTypes).to.deep.equal(resourceCatalog);

        const historyCollections = catalog.entries
            .filter((entry) => entry.modelKind === MODEL_KINDS.HISTORY)
            .map((entry) => entry.collection);
        expect(historyCollections).to.include("Patient_history");
        expect(historyCollections.length).to.equal(EXPECTED_RESOURCE_COUNT);

        const staticCollections = catalog.entries
            .filter((entry) => entry.modelKind === MODEL_KINDS.STATIC)
            .map((entry) => entry.collection)
            .sort();
        expect(staticCollections).to.deep.equal([
            "FHIRStoredID",
            "TemporalMigrationCheckpoint",
            "resourceRefBy"
        ]);
    });
});

describe("MongoDB provisioning schema and service indexes", function () {
    it("collects schema indexes and adds history version lookup service indexes", function () {
        const { modelMap } = registerFixtureModels();
        const catalog = buildModelCatalog({
            resourceCatalog: FIXTURE_CATALOG,
            discovered: discoverModelFilesForCatalog(FIXTURE_CATALOG, true)
        });

        const patientSchemaIndexes = collectSchemaIndexesFromModel(
            modelMap.Patient,
            catalog.entries.find((entry) => entry.modelName === "Patient")
        );
        expect(patientSchemaIndexes).to.have.length(1);
        expect(patientSchemaIndexes[0].key).to.deep.equal({ id: 1 });
        expect(patientSchemaIndexes[0].source).to.equal(INDEX_SOURCES.SCHEMA);

        const historyServiceIndexes = collectServiceIndexes(catalog);
        const patientHistoryIndex = historyServiceIndexes.find(
            (entry) => entry.collection === "Patient_history"
        );
        expect(patientHistoryIndex).to.exist;
        expect(patientHistoryIndex.name).to.equal(HISTORY_VERSION_LOOKUP_NAME);
        expect(patientHistoryIndex.key).to.deep.equal({
            id: 1,
            "meta.versionId": -1
        });
    });
});

describe("MongoDB provisioning desired manifest", function () {
    it("merges schema, service, and approved built-in temporal indexes deterministically", function () {
        const { modelMap, discovered } = registerFixtureModels();
        const catalog = buildModelCatalog({
            resourceCatalog: FIXTURE_CATALOG,
            discovered
        });
        const fixedGeneratedAt = "2026-09-05T00:00:00.000Z";

        const first = generateDesiredManifest(modelMap, {
            catalog,
            generatedAt: fixedGeneratedAt
        });
        const second = generateDesiredManifest(modelMap, {
            catalog,
            generatedAt: fixedGeneratedAt
        });

        expect(first.kind).to.equal("mongodb-desired-index-manifest");
        expect(first.version).to.equal(1);
        expect(first.checksum.value).to.equal(second.checksum.value);
        expect(computeManifestChecksumValue(first)).to.equal(first.checksum.value);

        const patientHistoryBaseline = first.baselineIndexes.find(
            (entry) =>
                entry.collection === "Patient_history" &&
                entry.source === INDEX_SOURCES.SERVICE
        );
        expect(patientHistoryBaseline).to.exist;
        expect(patientHistoryBaseline.name).to.equal(HISTORY_VERSION_LOOKUP_NAME);

        const temporal = collectApprovedTemporalDerivedIndexes();
        const searchParameter = require("@models/mongodb/provisioning/searchParameterIndexAdapter")
            .collectApprovedSearchParameterDerivedIndexes();
        expect(temporal.entries.length).to.be.greaterThan(0);
        expect(searchParameter.entries.length).to.be.greaterThan(0);
        expect(first.derivedIndexes.length).to.equal(
            temporal.entries.length + searchParameter.entries.length
        );
        expect(
            first.derivedIndexes.some((entry) => entry.source === INDEX_SOURCES.TEMPORAL)
        ).to.equal(true);
        expect(
            first.derivedIndexes.some((entry) => entry.source === INDEX_SOURCES.SEARCH_PARAMETER)
        ).to.equal(true);
        expect(first.derivedIndexes.every((entry) => entry.name.startsWith("fhir_temporal_") || entry.name.startsWith("fhir_sp_"))).to
            .equal(true);
        expect(first.derivedIndexPolicy.searchParameterPolicyVersion).to.equal(
            searchParameter.policyVersion
        );
        expect(first.artifactIdentity).to.deep.equal(temporal.artifactIdentity);
    });

    it("rejects desired manifests with SearchParameter artifact identity drift", function () {
        const { modelMap, discovered } = registerFixtureModels();
        const catalog = buildModelCatalog({
            resourceCatalog: FIXTURE_CATALOG,
            discovered
        });
        const manifest = generateDesiredManifest(modelMap, {
            catalog,
            generatedAt: "2026-09-05T00:00:00.000Z"
        });
        manifest.artifactIdentity = {
            ...manifest.artifactIdentity,
            bodyChecksum: "drifted"
        };

        expect(() => assertApprovedDerivedManifest(manifest)).to.throw(
            "SearchParameter artifact identity drifted"
        );
    });

    it("only includes built-in temporal definitions and excludes database custom definitions", function () {
        const builtin = collectApprovedTemporalDerivedIndexes();
        const customDefinition = {
            canonicalKey: "http://example.org/SearchParameter/custom::4.0.1",
            source: "database",
            effectiveStatus: "active",
            resource: {
                code: "custom-effective",
                resourceType: "SearchParameter",
                type: "date",
                expression: "Observation.effective"
            },
            lookupPlans: {
                "Observation::custom-effective": {
                    compilable: true,
                    plan: {
                        resourceType: "Observation",
                        code: "custom-effective",
                        searchType: "date",
                        extractionPaths: [{ path: "effectiveDateTime", datatype: "dateTime" }],
                        comparators: ["eq"]
                    }
                }
            }
        };

        expect(customDefinition.source).to.equal("database");
        expect(
            builtin.entries.some((entry) =>
                entry.sources?.lookupKeys?.includes("Observation::custom-effective")
            )
        ).to.equal(false);
    });
});
