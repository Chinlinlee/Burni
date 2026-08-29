require("module-alias/register");

const { expect } = require("chai");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { reloadRegistry } = require("@models/FHIR/searchParameter/registry/registryManager");
const { loadHitSetArtifact } = require("@models/FHIR/searchParameter/migration/hitSets");
const { prepareMainDocumentForHitSet } = require("@models/FHIR/searchParameter/migration/hitSetDocuments");
const { buildFixtureArchive } = require("@models/FHIR/searchParameter/migration/fixtureArchive");
const { buildLookupMatrix } = require("@models/FHIR/searchParameter/migration/lookupMatrix");
const { loadBuiltinDefinitions } = require("@models/FHIR/searchParameter/registry/sourceAdapter");
const { applyActivationOverlay } = require("@models/FHIR/searchParameter/registry/activationPolicy");
const { compileDefinition } = require("@models/FHIR/searchParameter/compiler/compiler");
const { mergeDefinitions } = require("@models/FHIR/searchParameter/registry/merge");
const { executeSearchQueryPlan } = require("@models/FHIR/searchParameter/executor/mongoExecutor");
const {
    startRegistryTestContext,
    stopRegistryTestContext
} = require("../support/registry-test-context");

const HIT_SETS_ARTIFACT = path.join(
    __dirname,
    "../../../models/FHIR/searchParameter/migration/artifacts/hit-sets.json"
);
const ARCHIVE_ROOT = path.join(__dirname, "../../fixtures/archive");

async function compileDefinitions() {
    const builtin = loadBuiltinDefinitions();
    const compiledDefinitions = [];

    for (const definition of builtin.definitions) {
        const compileResult = compileDefinition(definition);
        const activated = applyActivationOverlay(definition, {
            compilable: compileResult.compilable,
            reason: compileResult.reason
        });
        if (compileResult.lookupPlans) {
            activated.lookupPlans = compileResult.lookupPlans;
        }
        compiledDefinitions.push(activated);
    }

    return mergeDefinitions(compiledDefinitions).definitions;
}

/**
 * @param {string} collectionName
 * @param {Object[]} documents
 * @returns {Promise<Object[]>}
 */
async function queryCollection(collectionName, filter) {
    const collection = mongoose.connection.collection(collectionName);
    return collection.find(filter).toArray();
}

describe("SearchParameter hit-set verification", function () {
    it("commits a hit-set artifact covering every compiled lookup", function () {
        expect(fs.existsSync(HIT_SETS_ARTIFACT)).to.equal(true);
        const artifact = loadHitSetArtifact();
        expect(artifact.summary.compiledLookups).to.equal(1614);
        expect(artifact.summary.definedHitSets).to.equal(1614);
        expect(artifact.summary.pendingHitSets).to.equal(0);
        const companionDir = path.join(ARCHIVE_ROOT, "companion");
        const companionFiles = fs.readdirSync(companionDir).filter((file) => file.endsWith(".json"));
        expect(companionFiles.length).to.equal(146);
    });

    it("matches lookup matrix compiled count with defined hit-sets", async function () {
        const snapshot = await reloadRegistry();
        const definitions = await compileDefinitions();
        const matrix = buildLookupMatrix(snapshot, definitions);
        const artifact = loadHitSetArtifact();
        expect(matrix.summary.compiled).to.equal(artifact.summary.definedHitSets);
    });
});

describe("SearchParameter document hit-set gates", function () {
    before(async function () {
        this.timeout(120000);
        await startRegistryTestContext();
    });

    after(async function () {
        await stopRegistryTestContext();
    });

    it("verifies positive, companion negative, and missing semantics for compiled lookups", async function () {
        const snapshot = await reloadRegistry();
        const definitions = await compileDefinitions();
        const archive = buildFixtureArchive({ snapshot, definitions });
        const artifact = loadHitSetArtifact();
        const failures = [];

        for (const [resourceType, fixture] of Object.entries(archive.resources)) {
            const mainDocument = JSON.parse(
                fs.readFileSync(path.resolve(fixture.activeFixturePath), "utf8")
            );
            const companionDocument = JSON.parse(
                fs.readFileSync(path.resolve(fixture.companion.archivePath), "utf8")
            );
            const collectionName = `${resourceType}_hit_set_test`;
            const collection = mongoose.connection.collection(collectionName);
            await collection.drop().catch(() => undefined);

            const resourceLookups = artifact.resources[resourceType] || {};

            for (const [code, hitSet] of Object.entries(resourceLookups)) {
                const lookupKey = `${resourceType}::${code}`;
                const definition = snapshot.byLookupKey.get(lookupKey);
                const plan = definition?.lookupPlans?.[lookupKey]?.plan || definition?.compiledPlan;
                if (hitSet.status !== "defined") {
                    failures.push(`${lookupKey}: hit-set is not defined`);
                    continue;
                }

                if (!plan) {
                    failures.push(`${lookupKey}: missing plan`);
                    continue;
                }

                const preparedMain = prepareMainDocumentForHitSet(mainDocument, hitSet, plan);
                await collection.deleteMany({});
                await collection.insertMany([
                    { ...preparedMain, _fixtureRole: "main" },
                    { ...companionDocument, _fixtureRole: "companion" }
                ]);

                const parameterName = Object.keys(hitSet.positive.query)[0];
                const rawValue = hitSet.positive.query[parameterName];
                const filter = executeSearchQueryPlan(plan, rawValue, parameterName);
                const matches = await queryCollection(collectionName, filter);
                const mainMatches = matches.some((entry) => entry._fixtureRole === "main");
                const companionMatches = matches.some((entry) => entry._fixtureRole === "companion");

                if (hitSet.positive.expectDocument === "main" && !mainMatches) {
                    failures.push(`${lookupKey}: Mongo positive query did not match main fixture`);
                }
                if (hitSet.positive.expectDocument === "companion" && !companionMatches) {
                    failures.push(`${lookupKey}: Mongo positive query did not match companion fixture`);
                }
                if (
                    hitSet.companionNegative.expectDocument === "companion" &&
                    companionMatches &&
                    hitSet.positive.expectDocument === "main"
                ) {
                    failures.push(`${lookupKey}: Mongo positive query unexpectedly matched companion fixture`);
                }
                if (
                    hitSet.companionNegative.expectDocument === "main" &&
                    mainMatches &&
                    hitSet.positive.expectDocument === "companion"
                ) {
                    failures.push(`${lookupKey}: Mongo positive query unexpectedly matched main fixture`);
                }

                const presentMissingFilter = executeSearchQueryPlan(
                    plan,
                    "false",
                    `${code}:missing`
                );
                const absentMissingFilter = executeSearchQueryPlan(
                    plan,
                    "true",
                    `${code}:missing`
                );
                if (
                    JSON.stringify(presentMissingFilter) === JSON.stringify(absentMissingFilter)
                ) {
                    failures.push(`${lookupKey}: Mongo missing=true/false filters are identical`);
                }
            }

            await collection.drop().catch(() => undefined);
        }

        expect(failures, failures.slice(0, 20).join("\n")).to.deep.equal([]);
    });
});
