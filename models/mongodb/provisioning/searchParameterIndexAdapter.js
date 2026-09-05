"use strict";

const {
    loadApprovedBuiltinDefinitions
} = require("./temporalIndexAdapter");
const {
    generateSearchParameterIndexManifestWithDiagnostics
} = require("../../FHIR/searchParameter/indexes/nonTemporal");
const {
    validateSearchParameterIndexManifest,
    validateSearchParameterIndexEntryCompatibility
} = require("../../FHIR/searchParameter/indexes/nonTemporal");
const { getIndexIdentity } = require("../../FHIR/searchParameter/indexes/nonTemporal/indexManifest");
const { createDerivedIndexContract, INDEX_SOURCES } = require("./contracts");
const { NON_TEMPORAL_POLICY_VERSION } = require("../../FHIR/searchParameter/indexes/nonTemporal/constants");

/**
 * @param {unknown} diagnostic
 * @returns {string}
 */
function serializeDiagnostic(diagnostic) {
    if (typeof diagnostic === "string") {
        return diagnostic;
    }
    if (diagnostic && typeof diagnostic === "object") {
        const record = diagnostic;
        const code = record.code || "diagnostic";
        const message = record.message || JSON.stringify(record);
        const lookupKey = record.lookupKey ? ` lookup=${record.lookupKey}` : "";
        const path = record.path || record.extractionPath;
        const pathSuffix = path ? ` path=${path}` : "";
        const keyPattern = record.keyPattern ? ` keyPattern=${record.keyPattern}` : "";
        return `${code}: ${message}${lookupKey}${pathSuffix}${keyPattern}`;
    }
    return String(diagnostic);
}

/**
 * @param {Object} [options]
 * @returns {{
 *   entries: import('../../FHIR/searchParameter/indexes/nonTemporal/types').SearchParameterIndexEntry[],
 *   artifactIdentity: import('../../FHIR/searchParameter/registry/artifacts/artifactIdentity').ArtifactIdentity,
 *   policyVersion: string,
 *   diagnostics: string[],
 *   manifestValidation: { valid: boolean, errors: string[] }
 * }}
 */
function collectApprovedSearchParameterDerivedIndexes(options = {}) {
    const builtin = loadApprovedBuiltinDefinitions();
    const generated = generateSearchParameterIndexManifestWithDiagnostics(builtin.definitions);
    const manifestValidation = validateSearchParameterIndexManifest(generated.manifest, {
        requireNonEmpty: options.requireNonEmpty === true
    });

    /** @type {import('../../FHIR/searchParameter/indexes/nonTemporal/types').SearchParameterIndexEntry[]} */
    const entries = [];
    /** @type {string[]} */
    const diagnostics = [
        ...builtin.diagnostics.map(serializeDiagnostic),
        ...generated.diagnostics,
        ...manifestValidation.errors
    ];

    for (const entry of generated.manifest.indexes) {
        const compatibility = validateSearchParameterIndexEntryCompatibility(entry);
        if (!compatibility.valid) {
            diagnostics.push(...compatibility.diagnostics.map(serializeDiagnostic));
            continue;
        }
        entries.push(entry);
    }

    diagnostics.sort((left, right) => left.localeCompare(right));

    return {
        entries,
        artifactIdentity: builtin.artifactIdentity,
        policyVersion: NON_TEMPORAL_POLICY_VERSION,
        diagnostics,
        manifestValidation
    };
}

/**
 * @param {import('../../FHIR/searchParameter/indexes/nonTemporal/types').SearchParameterIndexEntry} entry
 * @returns {import('./types').DerivedIndexContract}
 */
function searchParameterEntryToDerivedIndex(entry) {
    return createDerivedIndexContract({
        collection: entry.resourceType,
        key: entry.key,
        options: {
            background: true
        },
        name: entry.name,
        source: INDEX_SOURCES.SEARCH_PARAMETER,
        identity: getIndexIdentity({
            resourceType: entry.resourceType,
            extractionPath: entry.extractionPath,
            datatype: entry.datatype,
            searchType: entry.searchType,
            keyPattern: entry.keyPattern,
            key: entry.key,
            options: entry.options,
            policyVersion: entry.policyVersion,
            fields: entry.fields,
            compatibility: entry.compatibility,
            provenance: {
                lookupKeys: entry.sources?.lookupKeys || [],
                canonicalKeys: entry.sources?.canonicalKeys || [],
                codes: entry.sources?.codes || []
            }
        }),
        searchParameter: {
            resourceType: entry.resourceType,
            extractionPath: entry.extractionPath,
            datatype: entry.datatype,
            searchType: entry.searchType,
            keyPattern: entry.keyPattern,
            policyVersion: entry.policyVersion,
            fields: [...entry.fields],
            lookupKeys: [...(entry.sources?.lookupKeys || [])].sort((left, right) =>
                left.localeCompare(right)
            ),
            canonicalKeys: [...(entry.sources?.canonicalKeys || [])].sort((left, right) =>
                left.localeCompare(right)
            )
        }
    });
}

module.exports = {
    collectApprovedSearchParameterDerivedIndexes,
    searchParameterEntryToDerivedIndex
};
