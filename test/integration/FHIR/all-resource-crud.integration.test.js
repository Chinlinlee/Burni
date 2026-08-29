require("module-alias/register");

const { expect } = require("chai");
const { loadFixtureProvenance } = require("@models/FHIR/searchParameter/migration/fixtureArchive");
const { loadResourceCatalog, EXPECTED_RESOURCE_COUNT } = require("../../support/fhir/resource-catalog");
const { compareCatalogWithFixtureProvenance, loadActiveFixture } = require("../../support/fhir/active-fixture");
const { normalizeComparableContent } = require("../../support/fhir/resource-content");
const {
    clearResourceCollection,
    createResourceViaService,
    readResourceViaService
} = require("../../support/fhir/fhir-service");
const {
    startFhirCrudTestContext,
    stopFhirCrudTestContext
} = require("../../support/fhir/crud-test-context");

const catalog = loadResourceCatalog();
/** @type {string[]} */
const namedCoverageResourceTypes = [];

describe("FHIR all-resource CRUD integration", function () {
    this.timeout(600000);

    before(async function () {
        await startFhirCrudTestContext();
    });

    after(async function () {
        await stopFhirCrudTestContext();
    });

    it("requires catalog and fixture provenance to stay aligned", function () {
        const provenance = loadFixtureProvenance();
        const { missingInProvenance, extraInProvenance } = compareCatalogWithFixtureProvenance(
            provenance,
            catalog
        );

        expect(missingInProvenance, missingInProvenance.join(", ")).to.deep.equal([]);
        expect(extraInProvenance, extraInProvenance.join(", ")).to.deep.equal([]);
    });

    it(`defines ${EXPECTED_RESOURCE_COUNT} named coverage cases from the catalog`, function () {
        expect(namedCoverageResourceTypes).to.deep.equal(catalog);
    });

    for (const resourceType of catalog) {
        namedCoverageResourceTypes.push(resourceType);

        describe(resourceType, function () {
            beforeEach(async function () {
                await clearResourceCollection(resourceType);
            });

            it(`creates and reads ${resourceType} through FHIR services`, async function () {
                const { resource: fixture, activeFixturePath } = loadActiveFixture(resourceType);
                const fixtureId = fixture.id;

                const created = await createResourceViaService(resourceType, fixture);
                expect(created.id, `${resourceType} create response missing id`).to.be.a("string").and
                    .not.empty;
                if (fixtureId) {
                    expect(created.id, `${resourceType} reused fixture id`).to.not.equal(fixtureId);
                }
                expect(created.resourceType).to.equal(resourceType);

                const readResult = await readResourceViaService(resourceType, created.id);
                expect(readResult.result.resourceType).to.equal(resourceType);
                expect(readResult.result.id).to.equal(created.id);

                const normalizedCreated = normalizeComparableContent(created);
                const normalizedRead = normalizeComparableContent(readResult.result);
                const normalizedFixture = normalizeComparableContent(fixture);

                expect(
                    normalizedRead,
                    `${resourceType} read/create round-trip mismatch`
                ).to.deep.equal(normalizedCreated);
                expect(
                    normalizedRead,
                    `${resourceType} persisted content mismatch (${activeFixturePath})`
                ).to.deep.equal(normalizedFixture);
            });
        });
    }
});
