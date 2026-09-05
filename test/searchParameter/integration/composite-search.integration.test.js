require("module-alias/register");

const { expect } = require("chai");
const { reloadRegistry, resetRegistryCache } = require("@models/FHIR/searchParameter/registry/registryManager");
const { getEffectiveDefinition } = require("@models/FHIR/searchParameter/registry/snapshot");
const { executeSearchQueryPlan } = require("@models/FHIR/searchParameter/executor/mongoExecutor");
const { documentMatchesFilter } = require("@models/FHIR/searchParameter/migration/hitSetBuilder");
const { InvalidSearchParameterValueError } = require("@models/FHIR/searchParameter/runtime/searchParameterErrors");
const { tryApplyRegistryParameter } = require("@models/FHIR/searchParameter/runtime/registrySearchHandler");

async function createSearchQuery(resourceType, query) {
    const parameterName = Object.keys(query)[0];
    await tryApplyRegistryParameter({ resourceType, query, parameterName });
    return query;
}

describe("FHIR R4 composite search integration", function () {
    beforeEach(function () {
        resetRegistryCache();
    });

    it("executes Observation code-value-quantity as one scalar Pair", async function () {
        const query = await createSearchQuery("Observation", {
            "code-value-quantity": "http://loinc.org|29463-7$gt5.4"
        });
        const filter = query.$and[0];

        expect(
            documentMatchesFilter(
                {
                    resourceType: "Observation",
                    code: { coding: [{ system: "http://loinc.org", code: "29463-7" }] },
                    valueQuantity: { value: 6 }
                },
                filter
            )
        ).to.equal(true);
    });

    it("correlates Observation component-code-value-quantity within one component", async function () {
        const query = await createSearchQuery("Observation", {
            "component-code-value-quantity": "http://loinc.org|8480-6$lt60"
        });
        const filter = query.$and[0];

        expect(
            documentMatchesFilter(
                {
                    resourceType: "Observation",
                    component: [
                        {
                            code: { coding: [{ system: "http://loinc.org", code: "8480-6" }] },
                            valueQuantity: { value: 50 }
                        }
                    ]
                },
                filter
            )
        ).to.equal(true);
        expect(
            documentMatchesFilter(
                {
                    resourceType: "Observation",
                    component: [
                        { code: { coding: [{ system: "http://loinc.org", code: "8480-6" }] } },
                        { valueQuantity: { value: 50 } }
                    ]
                },
                filter
            )
        ).to.equal(false);
    });

    it("supports Group Pair OR and repeated Pair AND", async function () {
        const orQuery = await createSearchQuery("Group", {
            "characteristic-value": "gender$mixed,owner$Eve"
        });
        const andQuery = await createSearchQuery("Group", {
            "characteristic-value": ["gender$mixed", "owner$Eve"]
        });
        const document = {
            resourceType: "Group",
            characteristic: [
                { code: { coding: [{ code: "gender" }] }, valueCodeableConcept: { coding: [{ code: "mixed" }] } },
                { code: { coding: [{ code: "owner" }] }, valueCodeableConcept: { coding: [{ code: "Eve" }] } }
            ]
        };

        expect(documentMatchesFilter(document, orQuery.$and[0])).to.equal(true);
        expect(documentMatchesFilter(document, andQuery.$and[0])).to.equal(true);
    });

    it("executes useContext and MolecularSequence composite plans", async function () {
        const contextQuery = await createSearchQuery("ActivityDefinition", {
            "context-type-quantity": "urn:burni:sample|code$eq10|kg"
        });
        const molecularQuery = await createSearchQuery("MolecularSequence", {
            "chromosome-window-coordinate": "urn:burni:sample|chromosome$42$42"
        });

        expect(contextQuery.$and[0]).to.have.nested.property("useContext.$elemMatch");
        expect(molecularQuery.$and[0]).to.have.property("$and");
    });

    it("rejects malformed composite values at the HTTP 400 validation boundary", async function () {
        let error;
        try {
            await createSearchQuery("Observation", {
                "code-value-quantity": "http://loinc.org|29463-7"
            });
        } catch (caught) {
            error = caught;
        }

        expect(error).to.be.instanceOf(InvalidSearchParameterValueError);
    });

    it("keeps registry plans executable for direct query-plan integration", async function () {
        const snapshot = await reloadRegistry({ databaseResources: [] });
        const definition = getEffectiveDefinition(snapshot, "Observation", "code-value-quantity");
        const filter = executeSearchQueryPlan(
            definition.compiledPlan,
            "http://loinc.org|29463-7$gt5.4",
            "code-value-quantity"
        );

        expect(filter).to.have.property("$and");
    });
});
