require("module-alias/register");

const fs = require("fs");
const path = require("path");
const { reloadRegistry } = require("@models/FHIR/searchParameter/registry/registryManager");
const { loadBuiltinDefinitions } = require("@models/FHIR/searchParameter/registry/sourceAdapter");
const { applyActivationOverlay } = require("@models/FHIR/searchParameter/registry/activationPolicy");
const { compileDefinition } = require("@models/FHIR/searchParameter/compiler/compiler");
const { mergeDefinitions } = require("@models/FHIR/searchParameter/registry/merge");
const { verifyProvenance } = require("@models/FHIR/searchParameter/migration/provenance");
const { buildLookupMatrix } = require("@models/FHIR/searchParameter/migration/lookupMatrix");
const { buildInventoryDiffReport } = require("@models/FHIR/searchParameter/migration/inventoryDiff");
const {
    discoverExampleMapping,
    loadExampleMapping,
    writeExampleMapping,
    FHIR_EXAMPLES_DISCOVERY_DIR
} = require("@models/FHIR/searchParameter/migration/fixtureMapping");
const { buildFixtureArchive } = require("@models/FHIR/searchParameter/migration/fixtureArchive");
const { buildMigrationManifest } = require("@models/FHIR/searchParameter/migration/migrationManifest");
const { verifyMigrationArtifacts } = require("@models/FHIR/searchParameter/migration/manifestDrift");

const ARTIFACTS_DIR = path.join(
    __dirname,
    "../models/FHIR/searchParameter/migration/artifacts"
);

async function compileDefinitions() {
    const builtin = loadBuiltinDefinitions();
    /** @type {import('@models/FHIR/searchParameter/registry/types').SearchParameterDefinition[]} */
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

async function main() {
    const provenanceResult = verifyProvenance();
    if (!provenanceResult.valid) {
        console.error("Provenance verification failed:");
        for (const error of provenanceResult.errors) {
            console.error(`  - ${error}`);
        }
        process.exit(1);
    }

    const snapshot = await reloadRegistry();
    const definitions = await compileDefinitions();
    const lookupMatrix = buildLookupMatrix(snapshot, definitions);
    const inventoryDiff = buildInventoryDiffReport();
    const examplesDir = process.env.FHIR_EXAMPLES_DIR || FHIR_EXAMPLES_DISCOVERY_DIR;
    const exampleMapping = fs.existsSync(examplesDir)
        ? discoverExampleMapping(examplesDir)
        : loadExampleMapping();
    if (fs.existsSync(examplesDir)) {
        writeExampleMapping(exampleMapping);
    }
    const fixtureArchive = buildFixtureArchive({
        snapshot,
        definitions,
        exampleMapping,
        examplesDir: fs.existsSync(examplesDir) ? examplesDir : undefined
    });
    const migrationManifest = buildMigrationManifest({
        snapshot,
        definitions,
        fixtureArchive
    });

    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

    const matrixPath = path.join(ARTIFACTS_DIR, "lookup-matrix.json");
    const diffPath = path.join(ARTIFACTS_DIR, "inventory-diff-report.json");
    const mappingPath = path.join(ARTIFACTS_DIR, "example-mapping.json");
    const manifestPath = path.join(ARTIFACTS_DIR, "migration-manifest.json");

    fs.writeFileSync(matrixPath, JSON.stringify(lookupMatrix, null, 2));
    fs.writeFileSync(diffPath, JSON.stringify(inventoryDiff, null, 2));
    fs.writeFileSync(mappingPath, JSON.stringify(exampleMapping, null, 2));
    fs.writeFileSync(manifestPath, JSON.stringify(migrationManifest, null, 2));

    const drift = verifyMigrationArtifacts({
        currentManifest: migrationManifest,
        fixtureArchive,
        manifestPath
    });
    if (!drift.valid) {
        console.error("Migration artifact drift verification failed after build:");
        for (const error of drift.errors) {
            console.error(`  - ${error}`);
        }
        process.exit(1);
    }

    console.log(`Wrote lookup matrix to ${matrixPath}`);
    console.log(`  Resources: ${lookupMatrix.resourceCount}`);
    console.log(`  Lookups: ${lookupMatrix.lookupCount}`);
    console.log(`Wrote inventory diff report to ${diffPath}`);
    console.log(`Wrote example mapping to ${mappingPath}`);
    console.log(`  Official examples: ${exampleMapping.summary.official}`);
    console.log(`  Synthetic required: ${exampleMapping.summary.missing}`);
    console.log(`Wrote fixture archive under ${fixtureArchive.archiveRoot}`);
    console.log(`  Official archived: ${fixtureArchive.summary.official}`);
    console.log(`  Derived archived: ${fixtureArchive.summary.derived}`);
    console.log(`  Synthetic archived: ${fixtureArchive.summary.synthetic}`);
    console.log(`Wrote migration manifest to ${manifestPath}`);
    console.log(`  Compiled lookups: ${migrationManifest.summary.compiledLookups}`);
    console.log(`  Defined hit-sets: ${migrationManifest.summary.definedHitSets}`);
    console.log(`  Pending hit-sets: ${migrationManifest.summary.pendingHitSets}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
