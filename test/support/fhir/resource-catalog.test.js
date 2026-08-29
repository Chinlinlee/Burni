require("module-alias/register");

const { expect } = require("chai");
const {
    EXPECTED_RESOURCE_COUNT,
    loadResourceCatalog
} = require("../../support/fhir/resource-catalog");
const { loadFixtureProvenance } = require("@models/FHIR/searchParameter/migration/fixtureArchive");
const { compareCatalogWithFixtureProvenance } = require("../../support/fhir/active-fixture");

describe("FHIR resource catalog support", function () {
    it("loads 146 unique resource types from the production catalog", function () {
        const catalog = loadResourceCatalog();
        expect(catalog).to.have.length(EXPECTED_RESOURCE_COUNT);
        expect(new Set(catalog).size).to.equal(EXPECTED_RESOURCE_COUNT);
        expect(catalog).to.include("Patient");
        expect(catalog).to.include("SearchParameter");
    });

    it("aligns catalog entries with fixture provenance", function () {
        const catalog = loadResourceCatalog();
        const provenance = loadFixtureProvenance();
        const { missingInProvenance, extraInProvenance } = compareCatalogWithFixtureProvenance(
            provenance,
            catalog
        );

        expect(missingInProvenance, missingInProvenance.join(", ")).to.deep.equal([]);
        expect(extraInProvenance, extraInProvenance.join(", ")).to.deep.equal([]);
    });
});
