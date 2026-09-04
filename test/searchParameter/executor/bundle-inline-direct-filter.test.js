require("module-alias/register");

const _ = require("lodash");
const { expect } = require("chai");
const { compileDefinition } = require("@models/FHIR/searchParameter/compiler/compiler");
const { CANONICAL_BUNDLE_INLINE_LOOKUPS } = require("@models/FHIR/searchParameter/compiler/bundleInlineMetadata");
const { executeSearchQueryPlan } = require("@models/FHIR/searchParameter/executor/mongoExecutor");
const {
    validateBundleInlineDirectValue,
    buildBundleInlineDirectFilter,
    bundleInlineGatingConditions
} = require("@models/FHIR/searchParameter/executor/bundleInlineDirectFilter");
const {
    validateAndBuildFilter
} = require("@models/FHIR/searchParameter/executor/queryValueParser");

function bundleCompositionPlan() {
    const compiled = compileDefinition({
        resource: {
            resourceType: "SearchParameter",
            url: "http://example.org/SearchParameter/Bundle-composition",
            version: "4.0.1",
            status: "active",
            code: "composition",
            base: ["Bundle"],
            type: "reference",
            expression: "Bundle.entry[0].resource",
            target: ["Composition"]
        },
        source: "builtin-bundle",
        canonicalKey: "http://example.org/SearchParameter/Bundle-composition::4.0.1",
        lookupKeys: ["Bundle::composition"],
        rawStatus: "active",
        effectiveStatus: "disabled",
        diagnostics: []
    });
    return compiled.lookupPlans["Bundle::composition"].plan;
}

function bundleMessagePlan() {
    const compiled = compileDefinition({
        resource: {
            resourceType: "SearchParameter",
            url: "http://example.org/SearchParameter/Bundle-message",
            version: "4.0.1",
            status: "active",
            code: "message",
            base: ["Bundle"],
            type: "reference",
            expression: "Bundle.entry[0].resource",
            target: ["MessageHeader"]
        },
        source: "builtin-bundle",
        canonicalKey: "http://example.org/SearchParameter/Bundle-message::4.0.1",
        lookupKeys: ["Bundle::message"],
        rawStatus: "active",
        effectiveStatus: "disabled",
        diagnostics: []
    });
    return compiled.lookupPlans["Bundle::message"].plan;
}

function gatingFilter(inlineTarget) {
    return { $and: bundleInlineGatingConditions(inlineTarget) };
}

function matchesDirectFilter(doc, filter) {
    if (filter.$and) {
        return filter.$and.every((clause) => matchesDirectFilter(doc, clause));
    }
    return Object.entries(filter).every(([path, expected]) => _.get(doc, path) === expected);
}

describe("Bundle inline direct identity filter", function () {
    const compositionInline = {
        mode: "embedded",
        ...CANONICAL_BUNDLE_INLINE_LOOKUPS.composition
    };
    const messageInline = {
        mode: "embedded",
        ...CANONICAL_BUNDLE_INLINE_LOOKUPS.message
    };

    it("builds gating for document Composition and message MessageHeader", function () {
        expect(bundleInlineGatingConditions(compositionInline)).to.deep.equal([
            { type: "document" },
            { "entry.0.resource.resourceType": "Composition" }
        ]);
        expect(bundleInlineGatingConditions(messageInline)).to.deep.equal([
            { type: "message" },
            { "entry.0.resource.resourceType": "MessageHeader" }
        ]);
    });

    it("matches a Composition by relative identity through executeSearchQueryPlan", function () {
        const filter = executeSearchQueryPlan(
            bundleCompositionPlan(),
            "Composition/comp-1",
            "composition"
        );
        expect(filter).to.deep.equal({
            $and: [
                { type: "document" },
                { "entry.0.resource.resourceType": "Composition" },
                { "entry.0.resource.id": "comp-1" }
            ]
        });
    });

    it("normalizes a bare Composition id", function () {
        const filter = executeSearchQueryPlan(bundleCompositionPlan(), "comp-1", "composition");
        expect(filter).to.deep.equal({
            $and: [
                { type: "document" },
                { "entry.0.resource.resourceType": "Composition" },
                { "entry.0.resource.id": "comp-1" }
            ]
        });
    });

    it("matches a Composition by absolute entry fullUrl", function () {
        const fullUrl = "https://example.org/fhir/Composition/comp-1";
        const filter = executeSearchQueryPlan(bundleCompositionPlan(), fullUrl, "composition");
        expect(filter).to.deep.equal({
            $and: [
                { type: "document" },
                { "entry.0.resource.resourceType": "Composition" },
                { "entry.0.fullUrl": fullUrl }
            ]
        });
    });

    it("matches a MessageHeader by absolute entry fullUrl", function () {
        const fullUrl = "https://example.org/fhir/MessageHeader/msg-1";
        const filter = executeSearchQueryPlan(bundleMessagePlan(), fullUrl, "message");
        expect(filter).to.deep.equal({
            $and: [
                { type: "message" },
                { "entry.0.resource.resourceType": "MessageHeader" },
                { "entry.0.fullUrl": fullUrl }
            ]
        });
    });

    it("normalizes a bare MessageHeader id", function () {
        const filter = executeSearchQueryPlan(bundleMessagePlan(), "msg-1", "message");
        expect(filter).to.deep.equal({
            $and: [
                { type: "message" },
                { "entry.0.resource.resourceType": "MessageHeader" },
                { "entry.0.resource.id": "msg-1" }
            ]
        });
    });

    it("requires bundle type and first-entry resource type gating in every direct filter", function () {
        const compositionFilter = executeSearchQueryPlan(
            bundleCompositionPlan(),
            "comp-1",
            "composition"
        );
        const messageFilter = executeSearchQueryPlan(bundleMessagePlan(), "msg-1", "message");
        expect(compositionFilter.$and.slice(0, 2)).to.deep.equal(
            gatingFilter(compositionInline).$and
        );
        expect(messageFilter.$and.slice(0, 2)).to.deep.equal(gatingFilter(messageInline).$and);
    });

    it("rejects wrong target type values", function () {
        expect(() =>
            executeSearchQueryPlan(bundleCompositionPlan(), "MessageHeader/msg-1", "composition")
        ).to.throw(/expected Composition/);
        expect(() =>
            executeSearchQueryPlan(bundleMessagePlan(), "Composition/comp-1", "message")
        ).to.throw(/expected MessageHeader/);
        expect(validateBundleInlineDirectValue(compositionInline, "MessageHeader/msg-1").valid).to.equal(
            false
        );
    });

    it("rejects versioned, contained, and logical identifier values", function () {
        for (const value of [
            "Composition/comp-1|2",
            "#contained-1",
            "urn:oid:example|12345"
        ]) {
            expect(() =>
                executeSearchQueryPlan(bundleCompositionPlan(), value, "composition")
            ).to.throw();
            expect(() => buildBundleInlineDirectFilter(compositionInline, value, undefined)).to.throw();
        }
    });

    it("does not use generic Resource.reference projection for inline targets", function () {
        const filter = executeSearchQueryPlan(bundleCompositionPlan(), "comp-1", "composition");
        expect(filter["entry.0.resource.reference"]).to.equal(undefined);
        expect(filter.$and.some((clause) => clause["entry.0.resource.reference"])).to.equal(false);
    });

    it("routes through validateAndBuildFilter for direct composition queries", function () {
        const result = validateAndBuildFilter(bundleCompositionPlan(), "comp-1", "composition");
        expect(result.valid).to.equal(true);
        expect(result.filter.$and).to.deep.include.members([
            { type: "document" },
            { "entry.0.resource.resourceType": "Composition" },
            { "entry.0.resource.id": "comp-1" }
        ]);
    });

    it("treats invalid stored bundle shapes as non-match predicates rather than query errors", function () {
        const filter = executeSearchQueryPlan(bundleCompositionPlan(), "comp-1", "composition");
        const validBundle = {
            type: "document",
            entry: [
                {
                    resource: { resourceType: "Composition", id: "comp-1" }
                }
            ]
        };
        const invalidBundle = {
            type: "collection",
            entry: [
                {
                    fullUrl: "https://example.org/fhir/Composition/comp-1",
                    resource: { resourceType: "Composition", id: "comp-1" }
                }
            ]
        };
        const missingFirstEntry = {
            type: "document",
            entry: []
        };
        const wrongFirstEntry = {
            type: "document",
            entry: [
                {
                    resource: { resourceType: "Patient", id: "patient-1" }
                },
                {
                    resource: { resourceType: "Composition", id: "comp-1" }
                }
            ]
        };
        expect(matchesDirectFilter(validBundle, filter)).to.equal(true);
        expect(matchesDirectFilter(invalidBundle, filter)).to.equal(false);
        expect(matchesDirectFilter(missingFirstEntry, filter)).to.equal(false);
        expect(matchesDirectFilter(wrongFirstEntry, filter)).to.equal(false);
    });
});
