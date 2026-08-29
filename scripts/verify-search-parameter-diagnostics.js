require("module-alias/register");

const fs = require("fs");
const path = require("path");
const { reloadRegistry } = require("@models/FHIR/searchParameter/registry/registryManager");
const { loadBuiltinDefinitions } = require("@models/FHIR/searchParameter/registry/sourceAdapter");
const { applyActivationOverlay } = require("@models/FHIR/searchParameter/registry/activationPolicy");
const { compileDefinition } = require("@models/FHIR/searchParameter/compiler/compiler");
const { mergeDefinitions } = require("@models/FHIR/searchParameter/registry/merge");
const { runDiagnosticsCiGate } = require("@models/FHIR/searchParameter/migration/diagnosticsCiGate");

const outputPath = path.join(__dirname, "../temp/search-parameter-diagnostics-report.json");

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
    const gate = runDiagnosticsCiGate({ snapshot, definitions });

    const report = {
        generatedAt: new Date().toISOString(),
        valid: gate.valid,
        integrity: {
            valid: gate.valid,
            errors: gate.errors,
            warnings: gate.warnings,
            summary: gate.summary
        },
        matrixSummary: gate.matrix.summary,
        manifestSummary: gate.migrationManifest.summary,
        snapshotSummary: {
            effectiveLookups: snapshot.byLookupKey.size,
            disabledLookups: snapshot.disabledLookupKeys.size,
            conflictLookups: snapshot.conflictLookupKeys.size,
            diagnostics: snapshot.diagnostics.length
        }
    };

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

    console.log(`Wrote diagnostics report to ${outputPath}`);
    console.log(`Valid: ${report.valid}`);
    console.log(`Resources: ${gate.summary.resourceCount}`);
    console.log(`Lookups: ${gate.summary.lookupCount}`);
    console.log(`Compiled: ${gate.summary.compiled}`);
    console.log(`Disabled: ${gate.summary.disabled}`);
    console.log(`Unsupported: ${gate.summary.unsupported}`);
    console.log(`Conflicts: ${gate.summary.conflictCount}`);

    if (gate.warnings.length > 0) {
        console.log("Warnings:");
        for (const warning of gate.warnings) {
            console.log(`  - ${warning}`);
        }
    }

    if (!report.valid) {
        console.error("Diagnostics verification failed:");
        for (const error of gate.errors) {
            console.error(`  - ${error}`);
        }
        process.exit(1);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
