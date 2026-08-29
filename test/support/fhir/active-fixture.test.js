require("module-alias/register");

const { expect } = require("chai");
const { loadResourceCatalog } = require("../../support/fhir/resource-catalog");
const { loadActiveFixture } = require("../../support/fhir/active-fixture");

describe("FHIR active fixture support", function () {
    it("loads Patient derived fixture with matching resourceType", function () {
        const fixture = loadActiveFixture("Patient");
        expect(fixture.valueSource).to.equal("derived");
        expect(fixture.resource.resourceType).to.equal("Patient");
        expect(fixture.activeFixturePath).to.include("derived/Patient.json");
    });

    it("loads synthetic fixture when provenance designates synthetic", function () {
        const fixture = loadActiveFixture("SubstanceNucleicAcid");
        expect(fixture.valueSource).to.equal("synthetic");
        expect(fixture.resource.resourceType).to.equal("SubstanceNucleicAcid");
        expect(fixture.activeFixturePath).to.include("synthetic/SubstanceNucleicAcid.json");
    });

    it("loads official fixture when no derived fixture exists", function () {
        const fixture = loadActiveFixture("Binary");
        expect(fixture.valueSource).to.equal("official");
        expect(fixture.resource.resourceType).to.equal("Binary");
        expect(fixture.activeFixturePath).to.include("official/Binary.json");
    });

    it("returns a clone that does not mutate archived fixture content", function () {
        const first = loadActiveFixture("Patient");
        first.resource.gender = "mutated";
        const second = loadActiveFixture("Patient");
        expect(second.resource.gender).to.not.equal("mutated");
    });

    it("fails when resource type is missing from provenance", function () {
        expect(() => loadActiveFixture("NotARealResource")).to.throw(/Missing fixture provenance/);
    });

    it("covers every catalog resource with an active fixture", function () {
        const catalog = loadResourceCatalog();
        for (const resourceType of catalog) {
            const fixture = loadActiveFixture(resourceType);
            expect(fixture.resource.resourceType).to.equal(resourceType);
            expect(fixture.activeFixturePath).to.be.a("string").and.not.empty;
        }
    });
});
