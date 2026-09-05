const productionResources = require("../../fhir.resourceList.json");
const { verifyProvenance } = require("./provenance");
const { buildLookupMatrix } = require("./lookupMatrix");
const { resolveLookupStatus } = require("../registry/snapshot");

/** Compile diagnostics emitted for classified lookup outcomes (disabled branch, abstract base, etc.). */
const ALLOWED_COMPILE_DIAGNOSTIC_CODES = new Set([
    "missing-expression",
    "lookup-disabled",
    "incompatible-branch",
    "missing-type-map",
    "incompatible-component-branch",
    "component-not-found",
    "component-version-mismatch",
    "missing-component-definition",
    "missing-component-expression",
    "missing-component",
    "unsupported-component-type",
    "chained-component"
]);

/**
 * @typedef {Object} IntegrityCheckResult
 * @property {boolean} valid
 * @property {string[]} errors
 * @property {string[]} warnings
 * @property {Object} summary
 */

/**
 * @param {import('../registry/types').RegistrySnapshot} snapshot
 * @param {import('../registry/types').SearchParameterDefinition[]} definitions
 * @returns {IntegrityCheckResult}
 */
function verifyRegistryIntegrity(snapshot, definitions) {
    const errors = [];
    const warnings = [];

    const provenanceResult = verifyProvenance();
    if (!provenanceResult.valid) {
        errors.push(...provenanceResult.errors);
    }

    const matrix = buildLookupMatrix(snapshot, definitions);
    const trackedLookups =
        matrix.summary.compiled + matrix.summary.disabled + matrix.summary.unsupported;

    if (matrix.resourceCount !== productionResources.length) {
        errors.push(
            `Resource count mismatch: matrix has ${matrix.resourceCount}, catalog has ${productionResources.length}`
        );
    }

    /** @type {Set<string>} */
    const accountedLookupKeys = new Set();
    for (const resourceType of productionResources) {
        const resourceEntry = matrix.resources[resourceType];
        if (!resourceEntry) {
            errors.push(`Missing matrix entry for resource: ${resourceType}`);
            continue;
        }
        for (const [code, lookup] of Object.entries(resourceEntry.lookups || {})) {
            accountedLookupKeys.add(`${resourceType}::${code}`);
            if (!lookup.outcome) {
                errors.push(`Unclassified lookup outcome: ${resourceType}::${code}`);
            }
        }
    }

    for (const definition of definitions) {
        for (const lookupKey of definition.lookupKeys) {
            const [resourceType] = lookupKey.split("::");
            if (!productionResources.includes(resourceType)) {
                continue;
            }
            if (!accountedLookupKeys.has(lookupKey)) {
                errors.push(`Lookup not tracked in matrix: ${lookupKey}`);
            }
        }
    }

    const conflictDiagnostics = snapshot.diagnostics.filter(
        (diagnostic) => diagnostic.category === "conflict"
    );
    if (conflictDiagnostics.length > 0) {
        for (const diagnostic of conflictDiagnostics) {
            errors.push(`Active conflict: ${diagnostic.lookupKey || diagnostic.canonicalKey}`);
        }
    }

    const unclassifiedDiagnostics = snapshot.diagnostics.filter(
        (diagnostic) =>
            diagnostic.category === "compile" &&
            !diagnostic.code.startsWith("unsupported") &&
            !ALLOWED_COMPILE_DIAGNOSTIC_CODES.has(diagnostic.code)
    );
    for (const diagnostic of unclassifiedDiagnostics) {
        errors.push(
            `Unclassified compiler failure: ${diagnostic.lookupKey || diagnostic.canonicalKey} (${diagnostic.code})`
        );
    }

    for (const lookupKey of snapshot.conflictLookupKeys) {
        if (!snapshot.disabledLookupKeys.has(lookupKey)) {
            errors.push(`Conflict lookup not in disabled set: ${lookupKey}`);
        }
    }

    const unknownLookups = [];
    for (const [lookupKey] of snapshot.byLookupKey) {
        const status = resolveLookupStatus(
            snapshot,
            ...lookupKey.split("::")
        );
        if (status === "unknown") {
            unknownLookups.push(lookupKey);
        }
    }
    if (unknownLookups.length > 0) {
        errors.push(`Unknown effective lookups in snapshot: ${unknownLookups.length}`);
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        summary: {
            resourceCount: matrix.resourceCount,
            lookupCount: trackedLookups,
            compiled: matrix.summary.compiled,
            disabled: matrix.summary.disabled,
            unsupported: matrix.summary.unsupported,
            noLookupResources: matrix.summary.noLookupResources.length,
            conflictCount: snapshot.conflictLookupKeys.size,
            diagnosticCount: snapshot.diagnostics.length,
            provenanceValid: provenanceResult.valid
        }
    };
}

module.exports = {
    verifyRegistryIntegrity
};
