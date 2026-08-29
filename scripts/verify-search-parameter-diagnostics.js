require("module-alias/register");

const fs = require("fs");
const path = require("path");
const { reloadRegistry } = require("@models/FHIR/searchParameter/registry/registryManager");
const { loadBuiltinDefinitions } = require("@models/FHIR/searchParameter/registry/sourceAdapter");
const { applyActivationOverlay } = require("@models/FHIR/searchParameter/registry/activationPolicy");
const { compileDefinition } = require("@models/FHIR/searchParameter/compiler/compiler");
const { mergeDefinitions } = require("@models/FHIR/searchParameter/registry/merge");
const { verifyRegistryIntegrity } = require("@models/FHIR/searchParameter/migration/diagnosticsIntegrity");
const { verifyProvenance } = require("@models/FHIR/searchParameter/migration/provenance");
const { buildLookupMatrix } = require("@models/FHIR/searchParameter/migration/lookupMatrix");
const { buildFixtureArchive } = require("@models/FHIR/searchParameter/migration/fixtureArchive");
const { buildMigrationManifest } = require("@models/FHIR/searchParameter/migration/migrationManifest");
const { verifyMigrationArtifacts } = require("@models/FHIR/searchParameter/migration/manifestDrift");

const outputPath = path.join(__dirname, "../temp/search-parameter-diagnostics-report.json");
const matrixArtifactPath = path.join(
    __dirname,
    "../models/FHIR/searchParameter/migration/artifacts/lookup-matrix.json"
);
const manifestArtifactPath = path.join(
    __dirname,
    "../models/FHIR/searchParameter/migration/artifacts/migration-manifest.json"
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
    const snapshot = await reloadRegistry();
    const definitions = await compileDefinitions();
    const integrity = verifyRegistryIntegrity(snapshot, definitions);
    const provenance = verifyProvenance();
    const matrix = buildLookupMatrix(snapshot, definitions);
    const fixtureArchive = buildFixtureArchive({ snapshot, definitions });
    const migrationManifest = buildMigrationManifest({
        snapshot,
        definitions,
        fixtureArchive
    });

    const report = {
        generatedAt: new Date().toISOString(),
        valid: integrity.valid && provenance.valid,
        provenance,
        integrity,
        matrixSummary: matrix.summary,
        fixtureSummary: fixtureArchive.summary,
        manifestSummary: migrationManifest.summary,
        snapshotSummary: {
            effectiveLookups: snapshot.byLookupKey.size,
            disabledLookups: snapshot.disabledLookupKeys.size,
            conflictLookups: snapshot.conflictLookupKeys.size,
            diagnostics: snapshot.diagnostics.length
        }
    };

    if (fs.existsSync(matrixArtifactPath)) {
        const committed = JSON.parse(fs.readFileSync(matrixArtifactPath, "utf8"));
        if (committed.lookupCount !== matrix.lookupCount) {
            integrity.errors.push(
                `Lookup matrix drift: committed ${committed.lookupCount}, current ${matrix.lookupCount}`
            );
            report.valid = false;
        }
        if (committed.summary.compiled !== matrix.summary.compiled) {
            integrity.errors.push(
                `Compiled count drift: committed ${committed.summary.compiled}, current ${matrix.summary.compiled}`
            );
            report.valid = false;
        }
    }

    if (fs.existsSync(manifestArtifactPath)) {
        const drift = verifyMigrationArtifacts({
            currentManifest: migrationManifest,
            fixtureArchive,
            manifestPath: manifestArtifactPath
        });
        if (!drift.valid) {
            integrity.errors.push(...drift.errors);
            report.valid = false;
        }
    }

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

    console.log(`Wrote diagnostics report to ${outputPath}`);
    console.log(`Valid: ${report.valid}`);
    console.log(`Resources: ${integrity.summary.resourceCount}`);
    console.log(`Lookups: ${integrity.summary.lookupCount}`);
    console.log(`Compiled: ${integrity.summary.compiled}`);
    console.log(`Disabled: ${integrity.summary.disabled}`);
    console.log(`Unsupported: ${integrity.summary.unsupported}`);

    if (integrity.warnings.length > 0) {
        console.log("Warnings:");
        for (const warning of integrity.warnings) {
            console.log(`  - ${warning}`);
        }
    }

    if (!report.valid) {
        console.error("Diagnostics verification failed:");
        for (const error of integrity.errors) {
            console.error(`  - ${error}`);
        }
        process.exit(1);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
