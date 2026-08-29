const crypto = require("crypto");
const { verifyProvenance, computeFileChecksum, getBundlePath } = require("./provenance");
const { getKnownHitSet } = require("./hitSets");
const { buildLookupMatrix } = require("./lookupMatrix");
const { loadRolloutConfig } = require("../config/featureFlags");

/**
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @returns {string}
 */
function hashPlan(plan) {
    return crypto.createHash("sha256").update(JSON.stringify(plan)).digest("hex");
}

/**
 * @param {Object} input
 * @param {import('../registry/types').RegistrySnapshot} input.snapshot
 * @param {import('../registry/types').SearchParameterDefinition[]} input.definitions
 * @param {Object} input.fixtureArchive
 * @returns {Object}
 */
function buildMigrationManifest({ snapshot, definitions, fixtureArchive }) {
    const provenance = verifyProvenance().provenance;
    const bundleChecksum = computeFileChecksum(getBundlePath());
    const lookupMatrix = buildLookupMatrix(snapshot, definitions);
    const rolloutConfig = loadRolloutConfig();

    /** @type {Record<string, Object>} */
    const resources = {};
    const summary = {
        compiledLookups: 0,
        definedHitSets: 0,
        pendingHitSets: 0,
        enabledResources: rolloutConfig.enabledResourceTypes.length
    };

    for (const resourceType of Object.keys(fixtureArchive.resources)) {
        const fixture = fixtureArchive.resources[resourceType];
        const matrixResource = lookupMatrix.resources[resourceType];
        const lookups = {};
        const resourceLookups = matrixResource?.lookups || {};

        for (const [code, lookup] of Object.entries(resourceLookups)) {
            const lookupKey = `${resourceType}::${code}`;
            const effectiveDefinition = snapshot.byLookupKey.get(lookupKey);
            const plan =
                effectiveDefinition?.lookupPlans?.[lookupKey]?.plan ||
                effectiveDefinition?.compiledPlan ||
                null;

            const hitSet =
                lookup.outcome === "compiled" ? getKnownHitSet(resourceType, code) : null;

            if (lookup.outcome === "compiled") {
                summary.compiledLookups += 1;
                if (hitSet) {
                    summary.definedHitSets += 1;
                } else {
                    summary.pendingHitSets += 1;
                }
            }

            lookups[code] = {
                lookupKey,
                outcome: lookup.outcome,
                reason: lookup.reason,
                searchType: lookup.searchType,
                canonicalKey: lookup.canonicalKey,
                planHash: plan ? hashPlan(plan) : null,
                diagnostics: lookup.reason ? [lookup.reason] : [],
                hitSet: hitSet || {
                    status: lookup.outcome === "compiled" ? "pending" : "not-applicable",
                    hash: null
                },
                enablement: {
                    registryEnabled: rolloutConfig.enabledResourceTypes.includes(resourceType),
                    outcome: lookup.outcome
                }
            };
        }

        resources[resourceType] = {
            fixture,
            fixtureCoverage:
                fixture.valueSource === "synthetic"
                    ? "synthetic"
                    : fixture.derived
                      ? "derived"
                      : "official",
            lookupCount: matrixResource?.lookupCount || 0,
            resourceOutcome: matrixResource?.outcome || null,
            enablement: {
                registryEnabled: rolloutConfig.enabledResourceTypes.includes(resourceType),
                structuralOnly: (matrixResource?.lookupCount || 0) === 0
            },
            lookups
        };
    }

    const manifestBody = {
        resources,
        summary
    };

    return {
        version: 1,
        generatedAt: new Date().toISOString(),
        source: {
            fhirVersion: provenance.fhirVersion,
            sourceUrl: provenance.sourceUrl,
            bundleChecksum,
            bundleDefinitionCount: provenance.definitionCount,
            provenanceChecksum: provenance.checksum,
            fetchedAt: provenance.fetchedAt
        },
        ...manifestBody,
        manifestHash: crypto.createHash("sha256").update(JSON.stringify(manifestBody)).digest("hex")
    };
}

module.exports = {
    hashPlan,
    buildMigrationManifest
};
