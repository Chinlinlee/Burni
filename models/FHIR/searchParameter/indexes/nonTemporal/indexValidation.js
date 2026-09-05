"use strict";

const {
    getIndexIdentity,
    buildIndexName,
    buildCanonicalIdentityBody
} = require("./indexManifest");
const { validateCompoundArrayCorrelation } = require("./arrayCorrelation");
const { createDiagnostic } = require("./diagnostics");
const { NON_TEMPORAL_MANIFEST_KIND, NON_TEMPORAL_MANIFEST_VERSION } = require("./constants");

/**
 * @param {import('./types').SearchParameterIndexEntry} entry
 * @returns {{ valid: boolean, diagnostics: import('./types').IndexPolicyDiagnostic[] }}
 */
function validateSearchParameterIndexEntryCompatibility(entry) {
    const diagnostics = [];
    const arrayPaths = entry.compatibility?.arrayPaths || [];
    const correlation = validateCompoundArrayCorrelation(
        entry.fields,
        arrayPaths,
        entry.extractionPath
    );
    diagnostics.push(...correlation.diagnostics);

    const expectedIdentity = getIndexIdentity({
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
    });
    if (entry.identity !== expectedIdentity) {
        diagnostics.push(
            createDiagnostic(
                "index-identity-mismatch",
                "SearchParameter derived index identity does not match canonical projection",
                { extractionPath: entry.extractionPath, keyPattern: entry.keyPattern }
            )
        );
    }

    const expectedName = buildIndexName({
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
    });
    if (entry.name !== expectedName) {
        diagnostics.push(
            createDiagnostic(
                "index-name-mismatch",
                "SearchParameter derived index has a non-deterministic physical name",
                { extractionPath: entry.extractionPath, keyPattern: entry.keyPattern }
            )
        );
    }

    return {
        valid: diagnostics.length === 0,
        diagnostics
    };
}

/**
 * @param {import('./types').SearchParameterDerivedIndexManifest} manifest
 * @param {Object} [options]
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateSearchParameterIndexManifest(manifest, options = {}) {
    const errors = [];
    if (!manifest || manifest.kind !== NON_TEMPORAL_MANIFEST_KIND) {
        errors.push("Invalid SearchParameter derived index manifest kind");
    }
    if (manifest?.version !== NON_TEMPORAL_MANIFEST_VERSION) {
        errors.push("Unsupported SearchParameter derived index manifest version");
    }
    if (!Array.isArray(manifest?.indexes)) {
        errors.push("SearchParameter derived index manifest indexes must be an array");
        return { valid: false, errors };
    }
    if (manifest.indexCount !== manifest.indexes.length) {
        errors.push("SearchParameter derived index manifest indexCount does not match indexes");
    }

    const identities = new Set();
    const names = new Set();
    for (const entry of manifest.indexes) {
        if (!entry?.resourceType || !entry.extractionPath || !entry.searchType) {
            errors.push("SearchParameter derived index entry is missing identity metadata");
            continue;
        }

        const compatibility = validateSearchParameterIndexEntryCompatibility(entry);
        if (!compatibility.valid) {
            errors.push(
                ...compatibility.diagnostics.map(
                    (diagnostic) => diagnostic.message || diagnostic.code
                )
            );
        }

        const identity = getIndexIdentity({
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
        });
        if (identities.has(identity)) {
            errors.push(`Duplicate SearchParameter derived index identity: ${identity}`);
        }
        identities.add(identity);

        const expectedName = buildIndexName({
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
        });
        if (entry.name !== expectedName) {
            errors.push(`SearchParameter derived index has a non-deterministic name: ${entry.name}`);
        }
        if (names.has(entry.name)) {
            errors.push(`Duplicate SearchParameter derived index name: ${entry.name}`);
        }
        names.add(entry.name);

        if (
            entry.options?.unique ||
            entry.options?.sparse ||
            entry.options?.collation ||
            entry.options?.partialFilterExpression
        ) {
            errors.push(
                `SearchParameter derived index ${entry.name} declares unsupported index options`
            );
        }
    }

    if (options.requireNonEmpty === true && manifest.indexes.length === 0) {
        errors.push("SearchParameter derived index manifest requires at least one entry");
    }

    return { valid: errors.length === 0, errors };
}

module.exports = {
    buildCanonicalIdentityBody,
    validateSearchParameterIndexEntryCompatibility,
    validateSearchParameterIndexManifest
};
