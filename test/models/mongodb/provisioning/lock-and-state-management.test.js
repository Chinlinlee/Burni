require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const {
    PROVISIONING_PHASES,
    PROVISIONING_PHASE_STATUS,
    PROVISIONING_RUN_STATUS,
    CONTROL_PLANE_COLLECTIONS
} = require("@models/mongodb/provisioning/contracts");
const {
    discoverModelFilesForCatalog,
    registerDiscoveredModels,
    disableAutomaticSchemaProvisioning
} = require("@models/mongodb/connector");
const { buildModelCatalog } = require("@models/mongodb/provisioning/modelCatalog");
const { generateDesiredManifest } = require("@models/mongodb/provisioning/desiredManifest");
const { createDdlClient } = require("@models/mongodb/provisioning/mongoDdlClient");
const {
    acquireProvisioningLock,
    releaseProvisioningLock,
    getProvisioningLock,
    createInMemoryProvisioningLockStore
} = require("@models/mongodb/provisioning/provisioningLock");
const {
    beginProvisioningRun,
    getLatestProvisioningState,
    getSuccessfulPhaseResults,
    createInMemoryProvisioningStateStore
} = require("@models/mongodb/provisioning/provisioningState");
const { runLockedMongoProvisioning } = require("@models/mongodb/provisioning/provisioningRun");
const { ensureControlPlaneCollections } = require("@models/mongodb/provisioning/controlPlaneModels");

const FIXTURE_CATALOG = ["Patient", "SearchParameter"];
const DATABASE_IDENTITY = "provisioning-lock-state-test";

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

function createFakeDb(existingCollections = new Set()) {
    /** @type {Set<string>} */
    const collections = new Set([
        ...existingCollections,
        CONTROL_PLANE_COLLECTIONS.LOCK,
        CONTROL_PLANE_COLLECTIONS.STATE
    ]);
    /** @type {Record<string, Record<string, unknown>>} */
    const indexes = {
        [CONTROL_PLANE_COLLECTIONS.LOCK]: {
            databaseIdentity_unique: { databaseIdentity: 1 }
        },
        [CONTROL_PLANE_COLLECTIONS.STATE]: {
            databaseIdentity_unique: { databaseIdentity: 1 }
        }
    };

    return {
        databaseName: DATABASE_IDENTITY,
        listCollections() {
            return {
                async toArray() {
                    return [...collections].map((name) => ({ name }));
                }
            };
        },
        async createCollection(name) {
            collections.add(name);
        },
        collection(name) {
            if (!indexes[name]) {
                indexes[name] = { _id_: { _id: 1 } };
            }
            return {
                listIndexes() {
                    return {
                        async toArray() {
                            return Object.entries(indexes[name]).map(([indexName, key]) => ({
                                name: indexName,
                                key
                            }));
                        }
                    };
                },
                async createIndex(key, options = {}) {
                    const indexName = options.name || "index";
                    indexes[name][indexName] = key;
                    return indexName;
                },
                async findOne(filter) {
                    return inMemoryDocs[name]?.find((doc) =>
                        Object.entries(filter).every(([field, value]) => doc[field] === value)
                    ) || null;
                },
                async insertOne(document) {
                    if (!inMemoryDocs[name]) {
                        inMemoryDocs[name] = [];
                    }
                    const duplicate = inMemoryDocs[name].some(
                        (doc) => doc.databaseIdentity === document.databaseIdentity
                    );
                    if (duplicate) {
                        const error = new Error("duplicate key");
                        error.code = 11000;
                        throw error;
                    }
                    inMemoryDocs[name].push({ ...document });
                },
                async findOneAndUpdate(filter, update, options = {}) {
                    if (!inMemoryDocs[name]) {
                        inMemoryDocs[name] = [];
                    }
                    let doc = inMemoryDocs[name].find((entry) =>
                        Object.entries(filter).every(([field, value]) => {
                            if (value && typeof value === "object" && "$gt" in value) {
                                return entry[field] > value.$gt;
                            }
                            if (value && typeof value === "object" && "$lte" in value) {
                                return entry[field] <= value.$lte;
                            }
                            return entry[field] === value;
                        })
                    );
                    if (!doc && options.upsert) {
                        doc = { ...(update.$set || {}) };
                        inMemoryDocs[name].push(doc);
                        return doc;
                    }
                    if (!doc) {
                        return null;
                    }
                    Object.assign(doc, update.$set || {});
                    if (update.$push?.phaseResults) {
                        doc.phaseResults = [...(doc.phaseResults || []), update.$push.phaseResults];
                    }
                    return { ...doc };
                },
                async deleteOne(filter) {
                    const before = inMemoryDocs[name]?.length || 0;
                    inMemoryDocs[name] = (inMemoryDocs[name] || []).filter(
                        (doc) =>
                            !Object.entries(filter).every(([field, value]) => doc[field] === value)
                    );
                    return { deletedCount: before - (inMemoryDocs[name]?.length || 0) };
                }
            };
        }
    };
}

/** @type {Record<string, Record<string, unknown>[]>>} */
const inMemoryDocs = {};

afterEach(async function () {
    for (const key of Object.keys(inMemoryDocs)) {
        delete inMemoryDocs[key];
    }
    while (openConnections.length > 0) {
        const connection = openConnections.pop();
        await connection.close();
    }
});

describe("MongoDB provisioning lock", function () {
    it("serializes concurrent owners and allows same-owner renewal", async function () {
        const store = createInMemoryProvisioningLockStore();
        const now = new Date("2026-09-05T00:00:00.000Z");

        const first = await acquireProvisioningLock(store, {
            databaseIdentity: DATABASE_IDENTITY,
            ownerId: "owner-a",
            runId: "run-a",
            leaseMs: 60_000,
            now
        });
        const conflict = await acquireProvisioningLock(store, {
            databaseIdentity: DATABASE_IDENTITY,
            ownerId: "owner-b",
            runId: "run-b",
            leaseMs: 60_000,
            now
        });
        const renewed = await acquireProvisioningLock(store, {
            databaseIdentity: DATABASE_IDENTITY,
            ownerId: "owner-a",
            runId: "run-a-2",
            leaseMs: 60_000,
            now: new Date(now.getTime() + 1_000)
        });

        expect(first.acquired).to.equal(true);
        expect(conflict.acquired).to.equal(false);
        expect(conflict.reason).to.equal("held-by-other-owner");
        expect(renewed.acquired).to.equal(true);
        expect(renewed.renewed).to.equal(true);
        expect(renewed.lock?.runId).to.equal("run-a-2");
    });

    it("reclaims expired locks for a new owner", async function () {
        const store = createInMemoryProvisioningLockStore();
        const acquiredAt = new Date("2026-09-05T00:00:00.000Z");
        const expiresAt = new Date("2026-09-05T00:01:00.000Z");

        await store.insertOne({
            databaseIdentity: DATABASE_IDENTITY,
            ownerId: "stale-owner",
            runId: "stale-run",
            acquiredAt,
            expiresAt,
            updatedAt: acquiredAt
        });

        const reclaimed = await acquireProvisioningLock(store, {
            databaseIdentity: DATABASE_IDENTITY,
            ownerId: "new-owner",
            runId: "new-run",
            leaseMs: 60_000,
            now: new Date("2026-09-05T00:02:00.000Z")
        });

        expect(reclaimed.acquired).to.equal(true);
        expect(reclaimed.reclaimed).to.equal(true);
        expect(reclaimed.lock?.ownerId).to.equal("new-owner");
    });

    it("handles duplicate-key races deterministically", async function () {
        const store = createInMemoryProvisioningLockStore();
        const now = new Date("2026-09-05T00:00:00.000Z");

        await store.insertOne({
            databaseIdentity: DATABASE_IDENTITY,
            ownerId: "winner",
            runId: "winner-run",
            acquiredAt: now,
            expiresAt: new Date(now.getTime() + 60_000),
            updatedAt: now
        });

        const raced = await acquireProvisioningLock(store, {
            databaseIdentity: DATABASE_IDENTITY,
            ownerId: "loser",
            runId: "loser-run",
            leaseMs: 60_000,
            now
        });

        expect(raced.acquired).to.equal(false);
        expect(raced.conflict).to.equal(true);
        expect(raced.reason).to.equal("held-by-other-owner");
        expect(raced.lock?.ownerId).to.equal("winner");
    });

    it("releases only the matching owner", async function () {
        const store = createInMemoryProvisioningLockStore();
        const now = new Date("2026-09-05T00:00:00.000Z");

        await acquireProvisioningLock(store, {
            databaseIdentity: DATABASE_IDENTITY,
            ownerId: "owner-a",
            runId: "run-a",
            leaseMs: 60_000,
            now
        });

        expect(
            await releaseProvisioningLock(store, {
                databaseIdentity: DATABASE_IDENTITY,
                ownerId: "owner-b"
            })
        ).to.equal(false);
        expect(
            await releaseProvisioningLock(store, {
                databaseIdentity: DATABASE_IDENTITY,
                ownerId: "owner-a"
            })
        ).to.equal(true);
        expect(await getProvisioningLock(store, DATABASE_IDENTITY)).to.equal(null);
    });
});

describe("MongoDB provisioning state", function () {
    it("persists run identity, manifest metadata, and drift summary", async function () {
        const store = createInMemoryProvisioningStateStore();
        const now = new Date("2026-09-05T00:00:00.000Z");

        await beginProvisioningRun(store, {
            databaseIdentity: DATABASE_IDENTITY,
            runId: "run-1",
            manifestChecksum: "checksum-1",
            manifestVersion: 1,
            now
        });

        const latest = await getLatestProvisioningState(store, DATABASE_IDENTITY);
        expect(latest?.runId).to.equal("run-1");
        expect(latest?.manifestChecksum).to.equal("checksum-1");
        expect(latest?.manifestVersion).to.equal(1);
        expect(latest?.status).to.equal(PROVISIONING_RUN_STATUS.RUNNING);
    });

    it("preserves successful prior phases for partial completion", function () {
        const phaseResults = [
            {
                phase: PROVISIONING_PHASES.COLLECTIONS,
                status: PROVISIONING_PHASE_STATUS.SUCCEEDED,
                startedAt: new Date(),
                completedAt: new Date(),
                summary: { collectionsCreated: 2 },
                errors: []
            },
            {
                phase: PROVISIONING_PHASES.BASELINE_INDEXES,
                status: PROVISIONING_PHASE_STATUS.FAILED,
                startedAt: new Date(),
                completedAt: new Date(),
                summary: { indexesMismatch: 1 },
                errors: ["Patient.id_1: mismatch"]
            }
        ];

        const successful = getSuccessfulPhaseResults(phaseResults);
        expect(successful).to.have.length(1);
        expect(successful[0].phase).to.equal(PROVISIONING_PHASES.COLLECTIONS);
    });
});

describe("Locked MongoDB provisioning run", function () {
    function buildDdlClient(manifest, options = {}) {
        const existingCollections =
            options.existingCollections || new Set(options.seedCollections || []);
        /** @type {Record<string, Record<string, unknown>[]>} */
        const indexesByCollection = options.indexesByCollection || {};

        return createDdlClient({
            listCollectionNames: async () => [...existingCollections],
            createCollection: async (collectionName) => {
                if (options.failCollection === collectionName) {
                    throw new Error(`createCollection denied for ${collectionName}`);
                }
                existingCollections.add(collectionName);
            },
            listIndexes: async (collectionName) =>
                indexesByCollection[collectionName] || [{ key: { _id: 1 }, name: "_id_" }],
            createIndex: async (collectionName, key, indexOptions) => {
                if (options.failIndex === indexOptions.name) {
                    throw new Error(`createIndex denied for ${indexOptions.name}`);
                }
                const bucket = indexesByCollection[collectionName] || [
                    { key: { _id: 1 }, name: "_id_" }
                ];
                bucket.push({ key, name: indexOptions.name, ...indexOptions });
                indexesByCollection[collectionName] = bucket;
                return indexOptions.name;
            }
        });
    }

    it("runs collection, baseline, temporal, and verify under one lock scope", async function () {
        const { modelMap, discovered } = registerFixtureModels();
        const manifest = buildFixtureManifest(modelMap, discovered);
        const lockStore = createInMemoryProvisioningLockStore();
        const stateStore = createInMemoryProvisioningStateStore();
        const db = createFakeDb();
        const ddlClient = buildDdlClient(manifest);

        const result = await runLockedMongoProvisioning({
            db,
            manifest,
            ddlClient,
            lockStore,
            stateStore,
            ownerId: "runner-1",
            runId: "locked-run-1",
            skipTemporalValidation: true
        });

        expect(result.status).to.equal(PROVISIONING_RUN_STATUS.SUCCEEDED);
        expect(result.phase).to.equal(PROVISIONING_PHASES.VERIFY);
        expect(result.phaseResults.map((entry) => entry.phase)).to.deep.equal([
            PROVISIONING_PHASES.COLLECTIONS,
            PROVISIONING_PHASES.BASELINE_INDEXES,
            PROVISIONING_PHASES.TEMPORAL_INDEXES,
            PROVISIONING_PHASES.VERIFY
        ]);
        expect(await getProvisioningLock(lockStore, DATABASE_IDENTITY)).to.equal(null);
        expect(result.state?.manifestChecksum).to.equal(manifest.checksum.value);
    });

    it("reports lock conflict without mutating provisioning phases", async function () {
        const { modelMap, discovered } = registerFixtureModels();
        const manifest = buildFixtureManifest(modelMap, discovered);
        const lockStore = createInMemoryProvisioningLockStore();
        const stateStore = createInMemoryProvisioningStateStore();
        const db = createFakeDb();
        const ddlClient = buildDdlClient(manifest);
        const now = new Date();

        await acquireProvisioningLock(lockStore, {
            databaseIdentity: DATABASE_IDENTITY,
            ownerId: "incumbent",
            runId: "incumbent-run",
            leaseMs: 60_000,
            now
        });

        const result = await runLockedMongoProvisioning({
            db,
            manifest,
            ddlClient,
            lockStore,
            stateStore,
            ownerId: "challenger",
            runId: "challenger-run",
            skipTemporalValidation: true,
            lockLeaseMs: 60_000
        });

        expect(result.status).to.equal(PROVISIONING_RUN_STATUS.LOCK_CONFLICT);
        expect(result.phaseResults).to.have.length(0);
        expect(result.conflictingLock?.ownerId).to.equal("incumbent");
    });

    it("retains completed collection work and resumes after partial baseline failure", async function () {
        const { modelMap, discovered } = registerFixtureModels();
        const manifest = buildFixtureManifest(modelMap, discovered);
        const patientBaseline = manifest.baselineIndexes.find(
            (entry) => entry.collection === "Patient"
        );
        const lockStore = createInMemoryProvisioningLockStore();
        const stateStore = createInMemoryProvisioningStateStore();
        const db = createFakeDb();
        const sharedCollections = new Set([
            CONTROL_PLANE_COLLECTIONS.LOCK,
            CONTROL_PLANE_COLLECTIONS.STATE
        ]);
        const ddlClient = buildDdlClient(manifest, {
            existingCollections: sharedCollections,
            failIndex: patientBaseline.name
        });

        const failed = await runLockedMongoProvisioning({
            db,
            manifest,
            ddlClient,
            lockStore,
            stateStore,
            ownerId: "runner-1",
            runId: "partial-run-1",
            skipTemporalValidation: true
        });

        expect(failed.status).to.equal(PROVISIONING_RUN_STATUS.FAILED);
        expect(failed.phase).to.equal(PROVISIONING_PHASES.BASELINE_INDEXES);
        expect(failed.phaseResults[0].status).to.equal(PROVISIONING_PHASE_STATUS.SUCCEEDED);
        expect(failed.phaseResults[1].status).to.equal(PROVISIONING_PHASE_STATUS.FAILED);

        const retryClient = buildDdlClient(manifest, {
            existingCollections: sharedCollections
        });
        const resumed = await runLockedMongoProvisioning({
            db,
            manifest,
            ddlClient: retryClient,
            lockStore,
            stateStore,
            ownerId: "runner-1",
            runId: "partial-run-2",
            skipTemporalValidation: true
        });

        expect(resumed.status).to.equal(PROVISIONING_RUN_STATUS.SUCCEEDED);
        expect(resumed.phaseResults[0].status).to.equal(PROVISIONING_PHASE_STATUS.SUCCEEDED);
        expect(retryClient.calls.createCollection.length).to.equal(0);
        expect(retryClient.calls.createIndex.length).to.be.greaterThan(0);
    });

    it("creates control-plane collections explicitly", async function () {
        const db = createFakeDb(new Set());
        await ensureControlPlaneCollections(db);

        const names = await db.listCollections().toArray();
        expect(names.map((entry) => entry.name)).to.include(CONTROL_PLANE_COLLECTIONS.LOCK);
        expect(names.map((entry) => entry.name)).to.include(CONTROL_PLANE_COLLECTIONS.STATE);
    });
});
