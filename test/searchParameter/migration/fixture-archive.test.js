require("module-alias/register");

const { expect } = require("chai");
const fs = require("fs");
const path = require("path");
const { loadExampleMapping } = require("@models/FHIR/searchParameter/migration/fixtureMapping");
const { buildFixtureArchive } = require("@models/FHIR/searchParameter/migration/fixtureArchive");
const { buildMigrationManifest } = require("@models/FHIR/searchParameter/migration/migrationManifest");
const { verifyMigrationArtifacts } = require("@models/FHIR/searchParameter/migration/manifestDrift");
const { reloadRegistry } = require("@models/FHIR/searchParameter/registry/registryManager");
const { loadBuiltinDefinitions } = require("@models/FHIR/searchParameter/registry/sourceAdapter");
const { applyActivationOverlay } = require("@models/FHIR/searchParameter/registry/activationPolicy");
const { compileDefinition } = require("@models/FHIR/searchParameter/compiler/compiler");
const { mergeDefinitions } = require("@models/FHIR/searchParameter/registry/merge");
const productionResources = require("@models/FHIR/fhir.resourceList.json");

const ARTIFACTS_DIR = path.join(
    __dirname,
    "../../../models/FHIR/searchParameter/migration/artifacts"
);
const ARCHIVE_ROOT = path.join(__dirname, "../../fixtures/archive");

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

describe("SearchParameter fixture archive", function () {
    it("maps each production resource to a fixed official or synthetic example", function () {
        const mapping = loadExampleMapping();
        expect(mapping.resourceCount).to.equal(146);
        expect(mapping.summary.official).to.equal(141);
        expect(mapping.summary.missing).to.equal(5);

        for (const resourceType of productionResources) {
            const entry = mapping.resources[resourceType];
            expect(entry).to.exist;
            if (entry.valueSource === "official") {
                expect(entry.sourceHash).to.match(/^[a-f0-9]{64}$/);
                expect(entry.verifiedResourceType).to.equal(resourceType);
            } else {
                expect(entry.valueSource).to.equal("synthetic");
            }
        }
    });

    it("uses patient-example-f201-roel as the fixed Patient mapping", function () {
        const mapping = loadExampleMapping();
        expect(mapping.resources.Patient.sourceFile).to.equal("patient-example-f201-roel.json");
    });

    it("archives official, derived, and synthetic fixtures without mutating source examples", async function () {
        const snapshot = await reloadRegistry();
        const definitions = await compileDefinitions();
        const archive = buildFixtureArchive({ snapshot, definitions });

        expect(archive.summary.official).to.equal(141);
        expect(archive.summary.synthetic).to.equal(5);
        expect(fs.existsSync(path.join(ARCHIVE_ROOT, "official", "Patient.json"))).to.equal(true);
        expect(fs.existsSync(path.join(ARCHIVE_ROOT, "derived", "Patient.json"))).to.equal(true);
        expect(
            fs.existsSync(path.join(ARCHIVE_ROOT, "synthetic", "SubstanceNucleicAcid.json"))
        ).to.equal(true);

        const patientDerived = JSON.parse(
            fs.readFileSync(path.join(ARCHIVE_ROOT, "derived", "Patient.json"), "utf8")
        );
        expect(patientDerived.generalPractitioner).to.exist;
        expect(patientDerived.link).to.exist;
        expect(archive.resources.Patient.derived.augmentations.length).to.be.greaterThan(0);
    });

    it("builds a migration manifest with source, fixture, plan, hit-set, and enablement metadata", async function () {
        const snapshot = await reloadRegistry();
        const definitions = await compileDefinitions();
        const archive = buildFixtureArchive({ snapshot, definitions });
        const manifest = buildMigrationManifest({
            snapshot,
            definitions,
            fixtureArchive: archive
        });

        expect(manifest.source.bundleChecksum).to.match(/^[a-f0-9]{64}$/);
        expect(manifest.summary.compiledLookups).to.equal(1614);
        expect(manifest.summary.definedHitSets).to.equal(1614);
        expect(manifest.summary.pendingHitSets).to.equal(0);
        expect(manifest.resources.Patient.lookups.name.planHash).to.match(/^[a-f0-9]{64}$/);
        expect(manifest.resources.Patient.lookups.name.hitSet.status).to.equal("defined");
        expect(manifest.resources.Patient.fixtureCoverage).to.equal("derived");
    });

    it("fails manifest drift verification when bundle or fixture hashes change", async function () {
        const manifestPath = path.join(ARTIFACTS_DIR, "migration-manifest.json");
        if (!fs.existsSync(manifestPath)) {
            this.skip();
        }

        const snapshot = await reloadRegistry();
        const definitions = await compileDefinitions();
        const archive = buildFixtureArchive({ snapshot, definitions });
        const manifest = buildMigrationManifest({
            snapshot,
            definitions,
            fixtureArchive: archive
        });

        const drift = verifyMigrationArtifacts({
            currentManifest: manifest,
            fixtureArchive: archive,
            manifestPath
        });
        expect(drift.valid).to.equal(true, drift.errors.join("; "));

        const tampered = JSON.parse(JSON.stringify(manifest));
        tampered.source.bundleChecksum = "0".repeat(64);
        const tamperedDrift = verifyMigrationArtifacts({
            currentManifest: tampered,
            fixtureArchive: archive,
            manifestPath
        });
        expect(tamperedDrift.valid).to.equal(false);
    });

    it("has committed example mapping and migration manifest artifacts", function () {
        const mappingPath = path.join(ARTIFACTS_DIR, "example-mapping.json");
        const manifestPath = path.join(ARTIFACTS_DIR, "migration-manifest.json");
        expect(fs.existsSync(mappingPath)).to.equal(true);
        expect(fs.existsSync(manifestPath)).to.equal(true);

        const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
        expect(manifest.version).to.equal(1);
        expect(Object.keys(manifest.resources)).to.have.length(146);
    });
});
