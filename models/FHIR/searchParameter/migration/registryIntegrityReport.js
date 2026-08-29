const productionResources = require("../../fhir.resourceList.json");
const { verifyProvenance } = require("./provenance");
const { buildLookupMatrix } = require("./lookupMatrix");
const { loadFixtureProvenance } = require("./fixtureArchive");
const { loadResourceEnablementArtifact } = require("./resourceEnablementGates");

/**
 * Snapshot 含 Bundle 與 DB overlay；傳入的 definitions 用來補 lookupPlans。
 * @param {import('../registry/types').RegistrySnapshot} snapshot
 * @param {import('../registry/types').SearchParameterDefinition[]} [definitions]
 * @returns {import('../registry/types').SearchParameterDefinition[]}
 */
function collectDefinitions(snapshot, definitions = []) {
    const byKey = new Map();
    for (const definition of definitions) {
        byKey.set(definition.canonicalKey, definition);
    }
    for (const [canonicalKey, definition] of snapshot.byCanonicalKey) {
        const existing = byKey.get(canonicalKey);
        if (!existing) {
            byKey.set(canonicalKey, definition);
            continue;
        }
        byKey.set(canonicalKey, {
            ...existing,
            ...definition,
            lookupPlans: definition.lookupPlans || existing.lookupPlans
        });
    }
    return [...byKey.values()];
}

/**
 * @param {string} resourceType
 * @param {number} lookupCount
 * @param {Object | null} enablementArtifact
 * @returns {Object}
 */
function buildResourceEnablement(resourceType, lookupCount, enablementArtifact) {
    const artifactEntry = enablementArtifact?.resources?.[resourceType];
    return {
        registryEnabled: true,
        fallbackDisabled: true,
        gatesPassed: artifactEntry ? artifactEntry.passed === true : null,
        structuralOnly: lookupCount === 0
    };
}

/**
 * @param {Set<string>} outcomes
 * @param {number} lookupCount
 * @returns {'compiled' | 'disabled' | 'unsupported' | 'no-lookup'}
 */
function classifyResourceOutcome(outcomes, lookupCount) {
    if (lookupCount === 0) {
        return "no-lookup";
    }
    if (outcomes.size === 1) {
        return /** @type {'compiled' | 'disabled' | 'unsupported'} */ ([...outcomes][0]);
    }
    if (outcomes.has("disabled")) {
        return "disabled";
    }
    if (outcomes.has("compiled")) {
        return "compiled";
    }
    return "unsupported";
}

/**
 * @param {Object} input
 * @param {import('../registry/types').RegistrySnapshot} input.snapshot
 * @param {import('../registry/types').SearchParameterDefinition[]} [input.definitions]
 * @returns {Object}
 */
function buildRegistryIntegrityReport({ snapshot, definitions = [] }) {
    const provenance = verifyProvenance().provenance;
    const reportDefinitions = collectDefinitions(snapshot, definitions);
    const matrix = buildLookupMatrix(snapshot, reportDefinitions);
    const fixtureByResource = loadFixtureProvenance();
    const enablementArtifact = loadResourceEnablementArtifact();
    const definitionByLookupKey = new Map();
    for (const definition of reportDefinitions) {
        for (const lookupKey of definition.lookupKeys) {
            definitionByLookupKey.set(lookupKey, definition);
        }
    }

    const reportedDefinitions = reportDefinitions.map((definition) => ({
        canonicalKey: definition.canonicalKey,
        url: definition.resource.url,
        version: definition.resource.version,
        code: definition.resource.code,
        base: definition.resource.base,
        type: definition.resource.type,
        source: definition.source,
        rawStatus: definition.rawStatus,
        effectiveStatus: definition.effectiveStatus,
        conflict: definition.lookupKeys.some((lookupKey) => snapshot.conflictLookupKeys.has(lookupKey)),
        disableReason: definition.disableReason || null,
        lookupKeys: [...definition.lookupKeys]
    }));

    /** @type {Record<string, Object>} */
    const resources = {};
    for (const resourceType of productionResources) {
        const matrixResource = matrix.resources[resourceType];
        const fixtureProvenance = fixtureByResource[resourceType];
        const lookupCount = matrixResource?.lookupCount || 0;
        const enablement = buildResourceEnablement(
            resourceType,
            lookupCount,
            enablementArtifact
        );
        /** @type {Record<string, Object>} */
        const lookups = {};
        const outcomes = new Set();

        for (const [code, lookup] of Object.entries(matrixResource?.lookups || {})) {
            const definition = definitionByLookupKey.get(lookup.lookupKey);
            outcomes.add(lookup.outcome);
            lookups[code] = {
                lookupKey: lookup.lookupKey,
                canonicalKey: lookup.canonicalKey,
                source: definition?.source || null,
                rawStatus: lookup.rawStatus,
                effectiveStatus: lookup.effectiveStatus,
                outcome: lookup.outcome,
                reason: lookup.reason || null,
                unsupportedReason: lookup.outcome === "unsupported" ? lookup.reason || null : null,
                conflict: snapshot.conflictLookupKeys.has(lookup.lookupKey),
                searchType: lookup.searchType,
                fixtureProvenance: {
                    valueSource: fixtureProvenance.valueSource,
                    activeFixturePath: fixtureProvenance.activeFixturePath,
                    activeFixtureHash: fixtureProvenance.activeFixtureHash
                },
                enablement: {
                    registryEnabled: enablement.registryEnabled
                }
            };
        }

        resources[resourceType] = {
            outcome: classifyResourceOutcome(outcomes, lookupCount),
            lookupCount,
            fixtureProvenance,
            enablement,
            lookups
        };
    }

    const abstractLookups = matrix.abstractLookups.map((lookup) => {
        const definition = definitionByLookupKey.get(lookup.lookupKey);
        return {
            lookupKey: lookup.lookupKey,
            resourceType: lookup.resourceType,
            code: lookup.code,
            canonicalKey: lookup.canonicalKey,
            source: definition?.source || null,
            outcome: lookup.outcome,
            reason: lookup.reason || null,
            unsupportedReason: lookup.outcome === "unsupported" ? lookup.reason || null : null,
            conflict: snapshot.conflictLookupKeys.has(lookup.lookupKey),
            searchType: lookup.searchType
        };
    });

    return {
        generatedAt: new Date().toISOString(),
        source: {
            fhirVersion: provenance.fhirVersion,
            sourceUrl: provenance.sourceUrl,
            bundleChecksum: provenance.checksum,
            definitionCount: provenance.definitionCount,
            fetchedAt: provenance.fetchedAt
        },
        definitions: reportedDefinitions,
        resources,
        abstractLookups,
        summary: {
            resourceCount: productionResources.length,
            definitionCount: reportedDefinitions.length,
            lookupCount: matrix.lookupCount,
            compiled: matrix.summary.compiled,
            disabled: matrix.summary.disabled,
            unsupported: matrix.summary.unsupported,
            noLookupResources: matrix.summary.noLookupResources,
            conflictCount: snapshot.conflictLookupKeys.size,
            enabledResources: productionResources.length,
            abstractLookupCount: abstractLookups.length
        }
    };
}

module.exports = {
    buildRegistryIntegrityReport
};
