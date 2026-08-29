require("module-alias/register");

const path = require("path");
const { expect } = require("chai");
const mongoose = require("mongoose");
const uuid = require("uuid");
const {
    reloadRegistry,
    getSnapshot,
    ensureRegistryLoaded
} = require("@models/FHIR/searchParameter/registry/registryManager");
const { resolveLookupStatus } = require("@models/FHIR/searchParameter/registry/snapshot");
const {
    startRegistryTestContext,
    stopRegistryTestContext
} = require("../support/registry-test-context");

const CUSTOM_LOOKUP_CODE = "registry-crud-reload-test";
const CUSTOM_PARAM_URL = "http://example.org/SearchParameter/registry-crud-reload-test";
const MISSING_BUNDLE_PATH = path.join(__dirname, "missing-search-parameter-bundle.json");

/**
 * @param {Object} [overrides]
 * @returns {Object}
 */
function buildCustomSearchParameter(overrides = {}) {
    return {
        resourceType: "SearchParameter",
        url: CUSTOM_PARAM_URL,
        version: "4.0.1",
        status: "active",
        code: CUSTOM_LOOKUP_CODE,
        base: ["Patient"],
        type: "string",
        expression: "Patient.name",
        ...overrides
    };
}

function loadSearchParameterModel() {
    if (!mongoose.models.SearchParameter) {
        const modelPath = path.join(__dirname, "../../../models/mongodb/model/SearchParameter.js");
        require(modelPath)(mongoose);
    }
}

describe("SearchParameter registry reload lifecycle", function () {
    describe("atomic reload and snapshot swapping", function () {
        it("increments snapshot version atomically on successful reload", async function () {
            const first = await reloadRegistry({ databaseResources: [] });
            const second = await reloadRegistry({ databaseResources: [] });
            expect(second.version).to.equal(first.version + 1);
            expect(getSnapshot()).to.equal(second);
        });

        it("deduplicates concurrent reloads into a single snapshot swap", async function () {
            const baseline = await reloadRegistry({ databaseResources: [] });
            const [first, second] = await Promise.all([
                reloadRegistry({ databaseResources: [] }),
                reloadRegistry({ databaseResources: [] })
            ]);
            expect(first).to.equal(second);
            expect(first.version).to.equal(baseline.version + 1);
        });

        it("publishes a new database overlay lookup only after reload completes", async function () {
            const baseline = await reloadRegistry({ databaseResources: [] });
            const inFlightSnapshot = await ensureRegistryLoaded();
            const updated = await reloadRegistry({
                databaseResources: [buildCustomSearchParameter()]
            });

            expect(updated.version).to.be.greaterThan(baseline.version);
            expect(inFlightSnapshot).to.equal(baseline);
            expect(inFlightSnapshot.version).to.equal(baseline.version);
            expect(resolveLookupStatus(inFlightSnapshot, "Patient", CUSTOM_LOOKUP_CODE)).to.equal(
                "unknown"
            );
            expect(resolveLookupStatus(updated, "Patient", CUSTOM_LOOKUP_CODE)).to.equal(
                "effective"
            );
            expect(getSnapshot()).to.equal(updated);
        });
    });

    describe("in-flight snapshot consistency", function () {
        it("keeps a captured snapshot reference stable across reload", async function () {
            const baseline = await reloadRegistry({ databaseResources: [] });
            const requestSnapshot = await ensureRegistryLoaded();

            await reloadRegistry({ databaseResources: [buildCustomSearchParameter()] });

            expect(requestSnapshot).to.equal(baseline);
            expect(resolveLookupStatus(requestSnapshot, "Patient", CUSTOM_LOOKUP_CODE)).to.equal(
                "unknown"
            );
        });

        it("swaps to a fully built snapshot after reload completes", async function () {
            const baseline = await reloadRegistry({ databaseResources: [] });
            const updated = await reloadRegistry({
                databaseResources: [buildCustomSearchParameter()]
            });

            expect(updated.version).to.be.greaterThan(baseline.version);
            expect(getSnapshot()).to.equal(updated);
            expect(Object.isFrozen(updated)).to.equal(true);
            expect(Object.isFrozen(updated.byLookupKey)).to.equal(true);
        });
    });

    describe("reload failure preservation", function () {
        it("preserves the current snapshot when reload fails", async function () {
            const baseline = await reloadRegistry({ databaseResources: [] });
            const versionBefore = baseline.version;

            const preserved = await reloadRegistry({ bundlePath: MISSING_BUNDLE_PATH });

            expect(preserved).to.equal(baseline);
            expect(preserved.version).to.equal(versionBefore);
            expect(getSnapshot()).to.equal(baseline);
        });

        it("keeps the usable snapshot when registryLifecycle reload hits a failure", async function () {
            const baseline = await reloadRegistry({ databaseResources: [] });
            const registryManager = require("@models/FHIR/searchParameter/registry/registryManager");
            const originalReload = registryManager.reloadRegistry;
            registryManager.reloadRegistry = async () => {
                throw new Error("simulated CRUD reload failure");
            };
            delete require.cache[
                require.resolve("@models/FHIR/searchParameter/runtime/registryLifecycle")
            ];
            const { reloadSearchParameterRegistry: reloadAfterFailure } = require("@models/FHIR/searchParameter/runtime/registryLifecycle");

            await reloadAfterFailure();

            expect(getSnapshot()).to.equal(baseline);
            registryManager.reloadRegistry = originalReload;
            delete require.cache[
                require.resolve("@models/FHIR/searchParameter/runtime/registryLifecycle")
            ];
        });

        it("recovers on the next successful reload after failure", async function () {
            const baseline = await reloadRegistry({ databaseResources: [] });

            await reloadRegistry({ bundlePath: MISSING_BUNDLE_PATH });
            const recovered = await reloadRegistry({
                databaseResources: [buildCustomSearchParameter()]
            });

            expect(recovered.version).to.be.greaterThan(baseline.version);
            expect(resolveLookupStatus(recovered, "Patient", CUSTOM_LOOKUP_CODE)).to.equal(
                "effective"
            );
        });
    });
});

describe("SearchParameter CRUD registry reload integration", function () {
    before(async function () {
        this.timeout(120000);
        await startRegistryTestContext();
        loadSearchParameterModel();
    });

    after(async function () {
        await stopRegistryTestContext();
    });

    beforeEach(async function () {
        loadSearchParameterModel();
        await mongoose.connection.collection("SearchParameter").deleteMany({});
        await reloadRegistry({ databaseResources: [] });
    });

    /**
     * @param {Object} [overrides]
     * @returns {Promise<Object>}
     */
    async function insertDatabaseSearchParameter(overrides = {}) {
        const resource = {
            id: uuid.v4(),
            ...buildCustomSearchParameter(overrides)
        };
        await mongoose.connection.collection("SearchParameter").insertOne(resource);
        return resource;
    }

    it("reloads registry after a database SearchParameter is created", async function () {
        const beforeReload = getSnapshot();
        expect(resolveLookupStatus(beforeReload, "Patient", CUSTOM_LOOKUP_CODE)).to.equal(
            "unknown"
        );

        await insertDatabaseSearchParameter();
        const reloaded = await reloadRegistry();

        expect(reloaded.version).to.be.greaterThan(beforeReload.version);
        expect(resolveLookupStatus(reloaded, "Patient", CUSTOM_LOOKUP_CODE)).to.equal(
            "effective"
        );
    });

    it("reloads registry after a database SearchParameter is updated", async function () {
        const created = await insertDatabaseSearchParameter();
        const snapshotAfterCreate = await reloadRegistry();
        const versionAfterCreate = snapshotAfterCreate.version;

        await mongoose.connection.collection("SearchParameter").updateOne(
            { id: created.id },
            {
                $set: {
                    type: "token",
                    expression: "Patient.gender"
                }
            }
        );
        const reloaded = await reloadRegistry();

        expect(reloaded.version).to.be.greaterThan(versionAfterCreate);
        const effective = reloaded.byLookupKey.get(`Patient::${CUSTOM_LOOKUP_CODE}`);
        expect(effective).to.not.equal(undefined);
        expect(effective.compiledPlan.searchType).to.equal("token");
    });

    it("reloads registry after a database SearchParameter is deleted", async function () {
        const created = await insertDatabaseSearchParameter();
        const snapshotAfterCreate = await reloadRegistry();
        expect(resolveLookupStatus(snapshotAfterCreate, "Patient", CUSTOM_LOOKUP_CODE)).to.equal(
            "effective"
        );
        const versionAfterCreate = snapshotAfterCreate.version;

        await mongoose.connection.collection("SearchParameter").deleteOne({ id: created.id });
        const reloaded = await reloadRegistry();

        expect(reloaded.version).to.be.greaterThan(versionAfterCreate);
        expect(resolveLookupStatus(reloaded, "Patient", CUSTOM_LOOKUP_CODE)).to.equal(
            "unknown"
        );
    });

    it("delegates CRUD lifecycle reload to registryManager", async function () {
        await insertDatabaseSearchParameter();
        const registryManager = require("@models/FHIR/searchParameter/registry/registryManager");
        const originalReload = registryManager.reloadRegistry;
        let reloadCalls = 0;
        registryManager.reloadRegistry = async (...args) => {
            reloadCalls += 1;
            return originalReload(...args);
        };
        delete require.cache[
            require.resolve("@models/FHIR/searchParameter/runtime/registryLifecycle")
        ];
        const { reloadSearchParameterRegistry } = require("@models/FHIR/searchParameter/runtime/registryLifecycle");

        await reloadSearchParameterRegistry();

        expect(reloadCalls).to.equal(1);
        registryManager.reloadRegistry = originalReload;
        delete require.cache[
            require.resolve("@models/FHIR/searchParameter/runtime/registryLifecycle")
        ];
    });

    it("wires SearchParameter CRUD services to registry reload", function () {
        const createSource = require("fs").readFileSync(
            require.resolve("@root/api/FHIRApiService/services/create.service"),
            "utf8"
        );
        const updateSource = require("fs").readFileSync(
            require.resolve("@root/api/FHIRApiService/services/update.service"),
            "utf8"
        );
        const deleteSource = require("fs").readFileSync(
            require.resolve("@root/api/FHIRApiService/services/delete.service"),
            "utf8"
        );

        expect(createSource).to.include('this.resourceType === "SearchParameter"');
        expect(createSource).to.include("reloadSearchParameterRegistry");
        expect(updateSource).to.include('this.resourceType === "SearchParameter"');
        expect(updateSource).to.include("reloadSearchParameterRegistry");
        expect(deleteSource).to.include('this.resourceType === "SearchParameter"');
        expect(deleteSource).to.include("reloadSearchParameterRegistry");
    });
});
