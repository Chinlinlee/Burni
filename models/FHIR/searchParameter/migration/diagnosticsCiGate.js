const fs = require("fs");
const path = require("path");
const { verifyRegistryIntegrity } = require("./diagnosticsIntegrity");
const { buildRegistryIntegrityReport } = require("./registryIntegrityReport");
const { buildLookupMatrix } = require("./lookupMatrix");
const { buildFixtureArchive } = require("./fixtureArchive");
const { buildMigrationManifest } = require("./migrationManifest");
const { verifyMigrationArtifacts } = require("./manifestDrift");

const ALLOWED_LOOKUP_OUTCOMES = new Set(["compiled", "disabled", "unsupported"]);
const ALLOWED_RESOURCE_OUTCOMES = new Set(["compiled", "disabled", "unsupported", "no-lookup"]);

const ARTIFACTS_DIR = path.join(__dirname, "artifacts");
const DEFAULT_MATRIX_PATH = path.join(ARTIFACTS_DIR, "lookup-matrix.json");
const DEFAULT_MANIFEST_PATH = path.join(ARTIFACTS_DIR, "migration-manifest.json");

/**
 * @param {Object} input
 * @param {import('../registry/types').RegistrySnapshot} input.snapshot
 * @param {import('../registry/types').SearchParameterDefinition[]} input.definitions
 * @param {string} [input.matrixPath]
 * @param {string} [input.manifestPath]
 * @returns {Object}
 */
function runDiagnosticsCiGate({
    snapshot,
    definitions,
    matrixPath = DEFAULT_MATRIX_PATH,
    manifestPath = DEFAULT_MANIFEST_PATH
}) {
    const errors = [];
    const warnings = [];

    const integrity = verifyRegistryIntegrity(snapshot, definitions);
    errors.push(...integrity.errors);
    warnings.push(...integrity.warnings);

    const report = buildRegistryIntegrityReport({ snapshot, definitions });
    const reportedCanonicalKeys = new Set(report.definitions.map((entry) => entry.canonicalKey));
    for (const [canonicalKey] of snapshot.byCanonicalKey) {
        if (!reportedCanonicalKeys.has(canonicalKey)) {
            errors.push(`Missing source definition in integrity report: ${canonicalKey}`);
        }
    }

    for (const [resourceType, resource] of Object.entries(report.resources)) {
        if (!ALLOWED_RESOURCE_OUTCOMES.has(resource.outcome)) {
            errors.push(`Unclassified resource outcome: ${resourceType}: ${resource.outcome}`);
        }
        for (const [code, lookup] of Object.entries(resource.lookups || {})) {
            if (!lookup.outcome) {
                errors.push(`Unclassified lookup outcome: ${resourceType}::${code}`);
                continue;
            }
            if (!ALLOWED_LOOKUP_OUTCOMES.has(lookup.outcome)) {
                errors.push(`Unclassified lookup outcome: ${resourceType}::${code}: ${lookup.outcome}`);
            }
        }
    }

    for (const lookup of report.abstractLookups) {
        if (!ALLOWED_LOOKUP_OUTCOMES.has(lookup.outcome)) {
            errors.push(`Unclassified abstract lookup: ${lookup.lookupKey}: ${lookup.outcome}`);
        }
    }

    const matrix = buildLookupMatrix(snapshot, definitions);
    if (fs.existsSync(matrixPath)) {
        const committed = JSON.parse(fs.readFileSync(matrixPath, "utf8"));
        if (committed.lookupCount !== matrix.lookupCount) {
            errors.push(
                `Lookup matrix drift: committed ${committed.lookupCount}, current ${matrix.lookupCount}`
            );
        }
        if (committed.summary.compiled !== matrix.summary.compiled) {
            errors.push(
                `Compiled count drift: committed ${committed.summary.compiled}, current ${matrix.summary.compiled}`
            );
        }
        if (committed.summary.disabled !== matrix.summary.disabled) {
            errors.push(
                `Disabled count drift: committed ${committed.summary.disabled}, current ${matrix.summary.disabled}`
            );
        }
        if (committed.summary.unsupported !== matrix.summary.unsupported) {
            errors.push(
                `Unsupported count drift: committed ${committed.summary.unsupported}, current ${matrix.summary.unsupported}`
            );
        }
    } else {
        errors.push(`Committed lookup matrix artifact not found: ${matrixPath}`);
    }

    const fixtureArchive = buildFixtureArchive({ snapshot, definitions });
    const migrationManifest = buildMigrationManifest({
        snapshot,
        definitions,
        fixtureArchive
    });
    const manifestDrift = verifyMigrationArtifacts({
        currentManifest: migrationManifest,
        fixtureArchive,
        manifestPath
    });
    if (!manifestDrift.valid) {
        errors.push(...manifestDrift.errors);
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        summary: {
            ...integrity.summary,
            definitionCount: report.summary.definitionCount,
            lookupCount: report.summary.lookupCount,
            manifestDriftValid: manifestDrift.valid
        },
        report,
        matrix,
        migrationManifest
    };
}

module.exports = {
    runDiagnosticsCiGate,
    ALLOWED_LOOKUP_OUTCOMES,
    ALLOWED_RESOURCE_OUTCOMES,
    DEFAULT_MATRIX_PATH,
    DEFAULT_MANIFEST_PATH
};
