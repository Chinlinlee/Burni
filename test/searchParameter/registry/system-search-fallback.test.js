require("module-alias/register");

const { expect } = require("chai");
const {
    buildRegistrySnapshot,
    getEffectiveDefinition,
    resolveLookupStatus
} = require("@models/FHIR/searchParameter/registry/snapshot");
const { createSearchQueryPlan } = require("@models/FHIR/searchParameter/compiler/searchQueryPlan");

function buildDefinition({
    resourceType,
    code,
    canonicalKey,
    compilable = true,
    effectiveStatus = "active"
}) {
    const lookupKey = `${resourceType}::${code}`;
    const plan = createSearchQueryPlan({
        canonicalKey,
        resourceType,
        code,
        searchType: code === "_lastUpdated" ? "date" : "token",
        extractionPaths: [
            {
                path: code === "_lastUpdated" ? "meta.lastUpdated" : "id",
                datatype: code === "_lastUpdated" ? "instant" : "id"
            }
        ],
        comparators: code === "_lastUpdated" ? ["eq", "gt"] : []
    });

    return {
        resource: {
            resourceType: "SearchParameter",
            url: `http://example.org/SearchParameter/${resourceType}-${code}`,
            version: "4.0.1",
            status: effectiveStatus === "active" ? "active" : "draft",
            code,
            base: [resourceType],
            type: plan.searchType
        },
        source: "builtin-bundle",
        canonicalKey,
        lookupKeys: [lookupKey],
        rawStatus: "active",
        effectiveStatus,
        diagnostics: [],
        lookupPlans: {
            [lookupKey]: compilable
                ? { compilable: true, plan }
                : { compilable: false, reason: "disabled for test" }
        }
    };
}

function buildSnapshot(definitions) {
    return buildRegistrySnapshot({
        definitions,
        diagnostics: [],
        version: 1
    });
}

describe("FHIR system search registry fallback", function () {
    it("falls back from a concrete resource to Resource", function () {
        const snapshot = buildSnapshot([
            buildDefinition({
                resourceType: "Resource",
                code: "_id",
                canonicalKey: "resource-id"
            })
        ]);

        expect(resolveLookupStatus(snapshot, "Patient", "_id")).to.equal("effective");
        expect(getEffectiveDefinition(snapshot, "Patient", "_id").compiledPlan).to.include({
            resourceType: "Patient",
            code: "_id"
        });
    });

    it("prefers a concrete system parameter definition", function () {
        const snapshot = buildSnapshot([
            buildDefinition({
                resourceType: "Resource",
                code: "_lastUpdated",
                canonicalKey: "resource-last-updated"
            }),
            buildDefinition({
                resourceType: "Patient",
                code: "_lastUpdated",
                canonicalKey: "patient-last-updated"
            })
        ]);

        const effective = getEffectiveDefinition(snapshot, "Patient", "_lastUpdated");
        expect(effective.canonicalKey).to.equal("patient-last-updated");
        expect(effective.compiledPlan.resourceType).to.equal("Patient");
    });

    it("does not bypass a disabled concrete definition with the abstract fallback", function () {
        const snapshot = buildSnapshot([
            buildDefinition({
                resourceType: "Resource",
                code: "_id",
                canonicalKey: "resource-id"
            }),
            buildDefinition({
                resourceType: "Patient",
                code: "_id",
                canonicalKey: "patient-id",
                compilable: false,
                effectiveStatus: "active"
            })
        ]);

        expect(resolveLookupStatus(snapshot, "Patient", "_id")).to.equal("disabled");
        expect(getEffectiveDefinition(snapshot, "Patient", "_id")).to.equal(null);
    });
});
