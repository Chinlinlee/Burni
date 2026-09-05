"use strict";

const { getDefinitionRecords } = require("../indexGenerator");
const { evaluateLookupIndexPolicy } = require("./indexPolicy");
const { createSearchParameterIndexManifest } = require("./indexManifest");
const { serializeDiagnostic } = require("./diagnostics");
const { NON_TEMPORAL_SEARCH_TYPES } = require("./constants");

/**
 * @param {import('../../registry/types').SearchParameterDefinition} definition
 * @param {string} lookupKey
 * @param {import('../../compiler/searchQueryPlan').SearchQueryPlan | undefined} plan
 * @returns {string | undefined}
 */
function resolveNonTemporalSearchType(definition, lookupKey, plan) {
    if (plan?.searchType) {
        return plan.searchType;
    }

    const lookupEntry = definition.lookupPlans?.[lookupKey];
    if (lookupEntry?.plan?.searchType) {
        return lookupEntry.plan.searchType;
    }

    if (typeof definition.resource?.type === "string") {
        return definition.resource.type;
    }

    return undefined;
}

/**
 * @param {unknown} definitions
 * @returns {{ specs: import('./types').ApprovedIndexSpec[], diagnostics: import('./types').IndexPolicyDiagnostic[] }}
 */
function collectApprovedSearchParameterIndexSpecs(definitions) {
    /** @type {import('./types').ApprovedIndexSpec[]} */
    const specs = [];
    /** @type {import('./types').IndexPolicyDiagnostic[]} */
    const diagnostics = [];

    for (const { definition, lookupKey, plan } of getDefinitionRecords(definitions)) {
        const searchType = resolveNonTemporalSearchType(definition, lookupKey, plan);
        if (!searchType || !NON_TEMPORAL_SEARCH_TYPES.includes(searchType)) {
            continue;
        }

        const result = evaluateLookupIndexPolicy({ definition, lookupKey, plan });
        diagnostics.push(...result.diagnostics);
        if (result.approved && result.specs) {
            specs.push(...result.specs);
        }
    }

    return { specs, diagnostics };
}

/**
 * @param {unknown} definitions
 * @returns {import('./types').SearchParameterDerivedIndexManifest}
 */
function generateSearchParameterIndexManifest(definitions) {
    const collected = collectApprovedSearchParameterIndexSpecs(definitions);
    return createSearchParameterIndexManifest(collected.specs);
}

/**
 * @param {unknown} definitions
 * @returns {{ manifest: import('./types').SearchParameterDerivedIndexManifest, diagnostics: string[] }}
 */
function generateSearchParameterIndexManifestWithDiagnostics(definitions) {
    const collected = collectApprovedSearchParameterIndexSpecs(definitions);
    const manifest = createSearchParameterIndexManifest(collected.specs);
    const diagnostics = collected.diagnostics.map(serializeDiagnostic).sort((left, right) =>
        left.localeCompare(right)
    );
    return { manifest, diagnostics };
}

module.exports = {
    resolveNonTemporalSearchType,
    collectApprovedSearchParameterIndexSpecs,
    generateSearchParameterIndexManifest,
    generateSearchParameterIndexManifestWithDiagnostics
};
