require("module-alias/register");

const fs = require("fs");
const path = require("path");
const { expect } = require("chai");
const { compileDefinition } = require("@models/FHIR/searchParameter/compiler/compiler");
const { applyActivationOverlay } = require("@models/FHIR/searchParameter/registry/activationPolicy");
const { augmentDocumentForHitSet } = require("@models/FHIR/searchParameter/migration/syntheticHitSetValues");
const { buildLookupHitSet } = require("@models/FHIR/searchParameter/migration/hitSetBuilder");
const { prepareMainDocumentForHitSet } = require("@models/FHIR/searchParameter/migration/hitSetDocuments");
const { executeSearchQueryPlan } = require("@models/FHIR/searchParameter/executor/mongoExecutor");
const { verifyGoldenFilter } = require("@models/FHIR/searchParameter/migration/resourceEnablementGates");

const OFFICIAL_BUNDLE_FIXTURE = path.join(
    __dirname,
    "../../fixtures/archive/official/Bundle.json"
);

function compileBundleLookup(code) {
    const definition = {
        resource: {
            resourceType: "SearchParameter",
            url: `http://example.org/SearchParameter/Bundle-${code}`,
            version: "4.0.1",
            status: "active",
            code,
            base: ["Bundle"],
            type: "reference",
            expression: "Bundle.entry[0].resource",
            target:
                code === "composition"
                    ? ["Composition"]
                    : code === "message"
                      ? ["MessageHeader"]
                      : ["Patient"]
        },
        source: "builtin-bundle",
        canonicalKey: `http://example.org/SearchParameter/Bundle-${code}::4.0.1`,
        lookupKeys: [`Bundle::${code}`],
        rawStatus: "active",
        effectiveStatus: "disabled",
        diagnostics: []
    };
    const compileResult = compileDefinition(definition);
    const activated = applyActivationOverlay(definition, {
        compilable: compileResult.compilable,
        reason: compileResult.reason
    });
    activated.lookupPlans = compileResult.lookupPlans;
    return compileResult.lookupPlans[`Bundle::${code}`].plan;
}

describe("Bundle inline synthetic hit-set values", function () {
    const baseBundle = JSON.parse(fs.readFileSync(OFFICIAL_BUNDLE_FIXTURE, "utf8"));

    for (const [code, expected] of [
        [
            "composition",
            {
                bundleType: "document",
                targetResourceType: "Composition",
                queryValue: "Composition/hit-set-composition"
            }
        ],
        [
            "message",
            {
                bundleType: "message",
                targetResourceType: "MessageHeader",
                queryValue: "MessageHeader/hit-set-message"
            }
        ]
    ]) {
        it(`augments ${code} with inline target resource and bundle type predicate`, function () {
            const plan = compileBundleLookup(code);
            const augmented = augmentDocumentForHitSet(baseBundle, plan);

            expect(augmented).to.exist;
            expect(augmented.queryValue).to.equal(expected.queryValue);
            expect(augmented.document.type).to.equal(expected.bundleType);
            expect(augmented.document.entry[0].resource).to.deep.equal({
                resourceType: expected.targetResourceType,
                id: `hit-set-${code}`
            });
        });

        it(`builds a golden filter and document match for Bundle ${code}`, function () {
            const plan = compileBundleLookup(code);
            const hitSet = buildLookupHitSet("Bundle", code, plan, baseBundle, {
                resourceType: "Bundle",
                type: "searchset"
            });

            expect(hitSet).to.exist;
            expect(hitSet.positive.query[code]).to.equal(expected.queryValue);

            const golden = verifyGoldenFilter(plan, hitSet);
            expect(golden.passed, golden.errors.join("; ")).to.equal(true);

            const prepared = prepareMainDocumentForHitSet(baseBundle, hitSet, plan);
            const filter = executeSearchQueryPlan(plan, expected.queryValue, code);
            expect(filter).to.deep.equal({
                $and: [
                    { type: expected.bundleType },
                    { "entry.0.resource.resourceType": expected.targetResourceType },
                    { "entry.0.resource.id": `hit-set-${code}` }
                ]
            });
            expect(prepared.type).to.equal(expected.bundleType);
            expect(prepared.entry[0].resource).to.deep.equal({
                resourceType: expected.targetResourceType,
                id: `hit-set-${code}`
            });
        });
    }
});
