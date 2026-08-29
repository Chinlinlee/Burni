require("module-alias/register");

const { expect } = require("chai");
const fs = require("fs");
const path = require("path");
const { verifyProvenance } = require("@models/FHIR/searchParameter/migration/provenance");
const { buildInventoryDiffReport } = require("@models/FHIR/searchParameter/migration/inventoryDiff");
const { buildLookupMatrix } = require("@models/FHIR/searchParameter/migration/lookupMatrix");
const { verifyRegistryIntegrity } = require("@models/FHIR/searchParameter/migration/diagnosticsIntegrity");
const { reloadRegistry } = require("@models/FHIR/searchParameter/registry/registryManager");
const { loadBuiltinDefinitions } = require("@models/FHIR/searchParameter/registry/sourceAdapter");
const { applyActivationOverlay } = require("@models/FHIR/searchParameter/registry/activationPolicy");
const { compileDefinition } = require("@models/FHIR/searchParameter/compiler/compiler");
const { mergeDefinitions } = require("@models/FHIR/searchParameter/registry/merge");
const productionResources = require("@models/FHIR/fhir.resourceList.json");

const MATRIX_ARTIFACT = path.join(
    __dirname,
    "../../models/FHIR/searchParameter/migration/artifacts/lookup-matrix.json"
);
const DIFF_ARTIFACT = path.join(
    __dirname,
    "../../models/FHIR/searchParameter/migration/artifacts/inventory-diff-report.json"
);

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

describe("SearchParameter migration artifacts", function () {
    it("verifies bundle provenance with checksum and metadata", function () {
        const result = verifyProvenance();
        expect(result.valid).to.equal(true, result.errors.join("; "));
        expect(result.provenance.fhirVersion).to.equal("4.0.1");
        expect(result.provenance.sourceUrl).to.include("hl7.org/fhir");
        expect(result.provenance.checksum).to.match(/^[a-f0-9]{64}$/);
        expect(result.provenance.fetchedAt).to.be.a("string");
        expect(result.provenance.definitionCount).to.equal(1375);
    });

    it("confirms migration inventory is not loaded by runtime", function () {
        const report = buildInventoryDiffReport();
        expect(report.inventoryLoadedByRuntime).to.equal(false);
        expect(report.inventoryResourceCount).to.be.greaterThan(0);
        expect(report.productionResourceCount).to.equal(productionResources.length);
    });

    it("builds a lookup matrix covering all production resources", async function () {
        const snapshot = await reloadRegistry();
        const definitions = await compileDefinitions();
        const matrix = buildLookupMatrix(snapshot, definitions);

        expect(matrix.resourceCount).to.equal(146);
        expect(matrix.lookupCount).to.equal(1697);
        expect(matrix.totalSourceLookupCount).to.equal(1706);
        expect(matrix.abstractLookups).to.have.length(9);
        expect(matrix.summary.compiled).to.be.greaterThan(0);
        expect(matrix.summary.compiled + matrix.summary.disabled + matrix.summary.unsupported).to.equal(
            1697
        );

        for (const resourceType of productionResources) {
            expect(matrix.resources[resourceType]).to.exist;
        }
    });

    it("passes registry integrity verification", async function () {
        const snapshot = await reloadRegistry();
        const definitions = await compileDefinitions();
        const integrity = verifyRegistryIntegrity(snapshot, definitions);

        expect(integrity.valid).to.equal(true, integrity.errors.join("; "));
        expect(integrity.summary.resourceCount).to.equal(146);
        expect(integrity.summary.lookupCount).to.equal(1697);
        expect(integrity.summary.conflictCount).to.equal(0);
    });

    it("matches committed lookup matrix artifact when present", function () {
        if (!fs.existsSync(MATRIX_ARTIFACT)) {
            this.skip();
        }
        const committed = JSON.parse(fs.readFileSync(MATRIX_ARTIFACT, "utf8"));
        expect(committed.resourceCount).to.equal(146);
        expect(committed.lookupCount).to.equal(1697);
        expect(committed.totalSourceLookupCount).to.equal(1706);
    });

    it("has committed inventory diff report artifact", function () {
        if (!fs.existsSync(DIFF_ARTIFACT)) {
            this.skip();
        }
        const report = JSON.parse(fs.readFileSync(DIFF_ARTIFACT, "utf8"));
        expect(report.inventoryLoadedByRuntime).to.equal(false);
        expect(report.summary).to.exist;
    });
});
