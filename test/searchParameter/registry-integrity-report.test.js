require("module-alias/register");

const { expect } = require("chai");
const productionResources = require("@models/FHIR/fhir.resourceList.json");
const { reloadRegistry } = require("@models/FHIR/searchParameter/registry/registryManager");
const {
    buildRegistryIntegrityReport
} = require("@models/FHIR/searchParameter/migration/registryIntegrityReport");

const ALLOWED_OUTCOMES = new Set(["compiled", "disabled", "unsupported", "no-lookup"]);

describe("Registry integrity diagnostics report", function () {
    this.timeout(180000);

    /** @type {import('@models/FHIR/searchParameter/registry/types').RegistrySnapshot} */
    let snapshot;
    /** @type {Object} */
    let report;

    before(async function () {
        snapshot = await reloadRegistry();
        report = buildRegistryIntegrityReport({
            snapshot,
            definitions: [...snapshot.byCanonicalKey.values()]
        });
    });

    it("accounts for every source definition and production lookup without an unclassified outcome", function () {
        expect(report.definitions.length).to.be.at.least(1375);
        expect(Object.keys(report.resources)).to.have.length(146);

        const reportedCanonicalKeys = new Set(report.definitions.map((entry) => entry.canonicalKey));
        for (const [canonicalKey] of snapshot.byCanonicalKey) {
            expect(
                reportedCanonicalKeys.has(canonicalKey),
                `missing source definition ${canonicalKey}`
            ).to.equal(true);
        }

        let productionLookupCount = 0;
        for (const resourceType of productionResources) {
            const resource = report.resources[resourceType];
            expect(resource, resourceType).to.exist;
            expect(ALLOWED_OUTCOMES.has(resource.outcome), `${resourceType} ${resource.outcome}`).to.equal(
                true
            );

            for (const [code, lookup] of Object.entries(resource.lookups || {})) {
                productionLookupCount += 1;
                expect(lookup.outcome, `${resourceType}::${code}`).to.be.a("string");
                expect(
                    ALLOWED_OUTCOMES.has(lookup.outcome),
                    `unclassified ${resourceType}::${code}: ${lookup.outcome}`
                ).to.equal(true);
            }
        }

        expect(productionLookupCount).to.be.at.least(1697);
        expect(report.abstractLookups).to.have.length(9);
        for (const lookup of report.abstractLookups) {
            expect(ALLOWED_OUTCOMES.has(lookup.outcome), lookup.lookupKey).to.equal(true);
        }
    });

    it("reports canonical identity, status, compiler outcome, conflict, fixture, and enablement for each lookup", function () {
        const patientActive = report.resources.Patient.lookups.active;
        expect(patientActive.lookupKey).to.equal("Patient::active");
        expect(patientActive.canonicalKey).to.equal(
            "http://hl7.org/fhir/SearchParameter/Patient-active::4.0.1"
        );
        expect(patientActive.source).to.equal("builtin-bundle");
        expect(patientActive.rawStatus).to.equal("draft");
        expect(patientActive.effectiveStatus).to.equal("active");
        expect(patientActive.outcome).to.equal("compiled");
        expect(patientActive.conflict).to.equal(false);
        expect(patientActive.fixtureProvenance.valueSource).to.equal("derived");
        expect(patientActive.fixtureProvenance.activeFixturePath).to.include(
            "fixtures/archive/derived/Patient.json"
        );
        expect(patientActive.fixtureProvenance.activeFixtureHash).to.match(/^[a-f0-9]{64}$/);
        expect(patientActive.enablement.registryEnabled).to.equal(true);

        const composite = report.resources.ActivityDefinition.lookups["context-type-quantity"];
        expect(composite.outcome).to.equal("unsupported");
        expect(composite.unsupportedReason).to.include("composite");
        expect(composite.conflict).to.equal(false);
        expect(composite.enablement.registryEnabled).to.equal(true);

        expect(report.resources.Binary.outcome).to.equal("no-lookup");
        expect(report.resources.Binary.lookupCount).to.equal(0);
        expect(report.resources.Binary.fixtureProvenance.valueSource).to.equal("official");
        expect(report.resources.Binary.enablement.registryEnabled).to.equal(true);
        expect(report.resources.Binary.enablement.structuralOnly).to.equal(true);

        expect(report.resources.SubstanceNucleicAcid.fixtureProvenance.valueSource).to.equal(
            "synthetic"
        );
    });

    it("attaches fixture provenance and enablement to every production resource and lookup", function () {
        for (const resourceType of productionResources) {
            const resource = report.resources[resourceType];
            expect(resource.fixtureProvenance.valueSource).to.be.oneOf([
                "official",
                "derived",
                "synthetic"
            ]);
            expect(resource.fixtureProvenance.activeFixtureHash).to.match(/^[a-f0-9]{64}$/);
            expect(resource.enablement.registryEnabled).to.equal(true);
            expect(resource.enablement.fallbackDisabled).to.equal(true);
            expect(resource.enablement.structuralOnly).to.equal(resource.lookupCount === 0);

            for (const [code, lookup] of Object.entries(resource.lookups)) {
                expect(lookup.canonicalKey, `${resourceType}::${code}`).to.be.a("string").and.not.empty;
                expect(lookup.source).to.be.a("string");
                expect(lookup.rawStatus).to.be.a("string");
                expect(lookup.effectiveStatus).to.be.a("string");
                expect(lookup.conflict).to.be.a("boolean");
                expect(lookup.fixtureProvenance.valueSource).to.equal(
                    resource.fixtureProvenance.valueSource
                );
                expect(lookup.enablement.registryEnabled).to.equal(resource.enablement.registryEnabled);
                if (lookup.outcome === "unsupported") {
                    expect(lookup.unsupportedReason, `${resourceType}::${code}`).to.be.a("string");
                    expect(lookup.unsupportedReason).to.not.equal("");
                }
            }
        }
    });

    it("includes raw and effective status on every source definition", function () {
        const patientActive = report.definitions.find(
            (entry) => entry.canonicalKey === "http://hl7.org/fhir/SearchParameter/Patient-active::4.0.1"
        );
        expect(patientActive).to.exist;
        expect(patientActive.code).to.equal("active");
        expect(patientActive.rawStatus).to.equal("draft");
        expect(patientActive.effectiveStatus).to.equal("active");
        expect(patientActive.source).to.equal("builtin-bundle");
        expect(patientActive.conflict).to.equal(false);
        expect(patientActive.lookupKeys).to.include("Patient::active");
    });
});
