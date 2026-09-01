require("module-alias/register");

const { expect } = require("chai");
const productionResources = require("@models/FHIR/fhir.resourceList.json");
const { reloadRegistry } = require("@models/FHIR/searchParameter/registry/registryManager");
const {
    runDiagnosticsCiGate,
    ALLOWED_LOOKUP_OUTCOMES,
    ALLOWED_RESOURCE_OUTCOMES
} = require("@models/FHIR/searchParameter/migration/diagnosticsCiGate");

/**
 * @param {import('@models/FHIR/searchParameter/registry/types').RegistrySnapshot} snapshot
 * @returns {import('@models/FHIR/searchParameter/registry/types').SearchParameterDefinition[]}
 */
function definitionsFromSnapshot(snapshot) {
    return [...snapshot.byCanonicalKey.values()];
}

describe("SearchParameter diagnostics CI gate", function () {
    this.timeout(300000);

    /** @type {import('@models/FHIR/searchParameter/registry/types').RegistrySnapshot} */
    let snapshot;
    /** @type {import('@models/FHIR/searchParameter/registry/types').SearchParameterDefinition[]} */
    let definitions;
    /** @type {Object} */
    let gate;

    before(async function () {
        snapshot = await reloadRegistry({ databaseResources: [] });
        definitions = definitionsFromSnapshot(snapshot);
        gate = runDiagnosticsCiGate({ snapshot, definitions });
    });

    it("passes registry integrity checks without unknown lookups or active conflicts", function () {
        expect(gate.valid, gate.errors.join("; ")).to.equal(true);
        expect(gate.summary.conflictCount).to.equal(0);
        expect(gate.summary.provenanceValid).to.equal(true);
        expect(gate.summary.resourceCount).to.equal(146);
        expect(gate.summary.lookupCount).to.equal(1697);
    });

    it("accounts for every source definition and production lookup without an unclassified outcome", function () {
        expect(gate.report.definitions.length).to.be.at.least(1375);
        expect(Object.keys(gate.report.resources)).to.have.length(146);
        expect(gate.summary.definitionCount).to.be.at.least(1375);

        const reportedCanonicalKeys = new Set(gate.report.definitions.map((entry) => entry.canonicalKey));
        for (const [canonicalKey] of snapshot.byCanonicalKey) {
            expect(
                reportedCanonicalKeys.has(canonicalKey),
                `missing source definition ${canonicalKey}`
            ).to.equal(true);
        }

        for (const resourceType of productionResources) {
            const resource = gate.report.resources[resourceType];
            expect(resource, resourceType).to.exist;
            expect(
                ALLOWED_RESOURCE_OUTCOMES.has(resource.outcome),
                `${resourceType} ${resource.outcome}`
            ).to.equal(true);

            for (const [code, lookup] of Object.entries(resource.lookups || {})) {
                expect(lookup.outcome, `${resourceType}::${code}`).to.be.a("string");
                expect(
                    ALLOWED_LOOKUP_OUTCOMES.has(lookup.outcome),
                    `unclassified ${resourceType}::${code}: ${lookup.outcome}`
                ).to.equal(true);
            }
        }

        for (const lookup of gate.report.abstractLookups) {
            expect(ALLOWED_LOOKUP_OUTCOMES.has(lookup.outcome), lookup.lookupKey).to.equal(true);
        }
    });

    it("verifies committed lookup matrix and migration manifest artifacts without drift", function () {
        expect(gate.summary.manifestDriftValid).to.equal(true);
        expect(gate.matrix.lookupCount).to.equal(1697);
        expect(gate.migrationManifest.summary.compiledLookups).to.equal(1617);
        expect(gate.migrationManifest.summary.pendingHitSets).to.equal(0);
    });
});
