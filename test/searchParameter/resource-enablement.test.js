require("module-alias/register");

const { expect } = require("chai");
const fs = require("fs");
const path = require("path");
const productionResources = require("@models/FHIR/fhir.resourceList.json");
const { reloadRegistry } = require("@models/FHIR/searchParameter/registry/registryManager");
const { loadBuiltinDefinitions } = require("@models/FHIR/searchParameter/registry/sourceAdapter");
const { applyActivationOverlay } = require("@models/FHIR/searchParameter/registry/activationPolicy");
const { compileDefinition } = require("@models/FHIR/searchParameter/compiler/compiler");
const { mergeDefinitions } = require("@models/FHIR/searchParameter/registry/merge");
const { buildFixtureArchive } = require("@models/FHIR/searchParameter/migration/fixtureArchive");
const { getEnablementGates } = require("@models/FHIR/searchParameter/migration/compatibilityPolicy");
const {
    evaluateAllResourceGates,
    buildResourceEnablementArtifact,
    loadResourceEnablementArtifact,
    verifyResourceEnablementArtifact,
    RESOURCE_ENABLEMENT_ARTIFACT
} = require("@models/FHIR/searchParameter/migration/resourceEnablementGates");
const {
    isLegacyFallbackEnabledForResource,
    loadRolloutConfig
} = require("@models/FHIR/searchParameter/config/featureFlags");
const { tryApplyRegistryParameter } = require("@models/FHIR/searchParameter/runtime/registrySearchHandler");

async function compileDefinitions() {
    const builtin = loadBuiltinDefinitions();
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

describe("SearchParameter per-resource enablement gates", function () {
    this.timeout(180000);

    /** @type {import('@models/FHIR/searchParameter/registry/types').RegistrySnapshot} */
    let snapshot;
    /** @type {import('@models/FHIR/searchParameter/registry/types').SearchParameterDefinition[]} */
    let definitions;
    /** @type {Object} */
    let fixtureArchive;

    before(async function () {
        snapshot = await reloadRegistry();
        definitions = await compileDefinitions();
        fixtureArchive = buildFixtureArchive({ snapshot, definitions });
    });

    it("documents the required enablement gates", function () {
        expect(getEnablementGates()).to.deep.equal([
            "golden-filter",
            "document-hit-set",
            "operator-multiplicity",
            "diagnostics",
            "structural-registry"
        ]);
    });

    it("passes golden filter, document hit-set, operator/multiplicity, diagnostics, and structural gates for every production resource", function () {
        const evaluation = evaluateAllResourceGates({
            snapshot,
            definitions,
            fixtureArchive
        });

        expect(evaluation.summary.resourceCount).to.equal(146);
        expect(evaluation.summary.passedResources).to.equal(146);
        expect(evaluation.summary.failedResources).to.equal(0);

        const failures = [];
        for (const resourceType of productionResources) {
            const entry = evaluation.resources[resourceType];
            if (!entry.passed) {
                failures.push(`${resourceType}: ${entry.errors.slice(0, 3).join("; ")}`);
            }
        }

        expect(failures, failures.slice(0, 20).join("\n")).to.deep.equal([]);
    });

    it("disables legacy fallback for every production resource after gates pass", function () {
        const rollout = loadRolloutConfig();
        expect(rollout.disableLegacyFallbackForAllEnabledResources).to.equal(true);
        expect(rollout.fallbackDisabledResourceTypes).to.have.length(146);

        for (const resourceType of productionResources) {
            expect(
                isLegacyFallbackEnabledForResource(resourceType),
                `${resourceType} should not use legacy fallback`
            ).to.equal(false);
        }
    });

    it("returns disabled instead of fallback for unknown codes on gated resources", async function () {
        process.env.SEARCH_REGISTRY_ENABLED = "true";
        process.env.SEARCH_LEGACY_FALLBACK_ENABLED = "true";
        delete require.cache[require.resolve("@models/FHIR/searchParameter/config/featureFlags")];
        delete require.cache[require.resolve("@models/FHIR/searchParameter/runtime/registrySearchHandler")];
        const { tryApplyRegistryParameter: retryApply } = require("@models/FHIR/searchParameter/runtime/registrySearchHandler");

        const result = await retryApply({
            resourceType: "Account",
            query: { definitelyUnknownParam: "x" },
            parameterName: "definitelyUnknownParam",
            paramsSearch: {
                definitelyUnknownParam: () => {
                    throw new Error("legacy handler must not run");
                }
            }
        });
        expect(result).to.equal("disabled");
    });

    it("matches the committed resource enablement artifact", function () {
        const current = buildResourceEnablementArtifact({
            snapshot,
            definitions,
            fixtureArchive
        });
        expect(current.summary.passedResources).to.equal(146);
        expect(current.summary.fallbackDisabledResources).to.equal(146);

        if (!fs.existsSync(RESOURCE_ENABLEMENT_ARTIFACT)) {
            this.skip();
        }

        const committed = loadResourceEnablementArtifact();
        const drift = verifyResourceEnablementArtifact(committed, current);
        expect(drift.valid, drift.errors.slice(0, 10).join("; ")).to.equal(true);
    });

    it("has a committed resource enablement artifact", function () {
        expect(fs.existsSync(RESOURCE_ENABLEMENT_ARTIFACT)).to.equal(true);
        const artifact = loadResourceEnablementArtifact();
        expect(artifact.version).to.equal(1);
        expect(Object.keys(artifact.resources)).to.have.length(146);
        expect(artifact.summary.passedResources).to.equal(146);
        expect(artifact.summary.fallbackDisabledResources).to.equal(146);
    });
});
