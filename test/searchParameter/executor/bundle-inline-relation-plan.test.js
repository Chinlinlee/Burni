require("module-alias/register");

const { expect } = require("chai");
const { compileDefinition } = require("@models/FHIR/searchParameter/compiler/compiler");
const {
    resolveBundleInlineTarget,
    CANONICAL_BUNDLE_INLINE_LOOKUPS
} = require("@models/FHIR/searchParameter/compiler/bundleInlineMetadata");
const { applyActivationOverlay } = require("@models/FHIR/searchParameter/registry/activationPolicy");
const { buildRegistrySnapshot } = require("@models/FHIR/searchParameter/registry/snapshot");
const { parseSearchParameterName } = require("@models/FHIR/searchParameter/runtime/parameterName");
const { createTypedFilterPlan } = require("@models/FHIR/searchParameter/executor/queryValueParser");
const {
    MAX_RELATION_COST,
    buildRelationPlan,
    buildRelationAggregation
} = require("@models/FHIR/searchParameter/executor/relationPlan");

function definition(resource, lookupKeys) {
    return {
        resource: {
            resourceType: "SearchParameter",
            url: `http://example.org/SearchParameter/${resource.code}`,
            version: "4.0.1",
            status: "active",
            ...resource
        },
        source: "builtin-bundle",
        canonicalKey: `http://example.org/SearchParameter/${resource.code}::4.0.1`,
        lookupKeys,
        rawStatus: "active",
        effectiveStatus: "disabled",
        diagnostics: []
    };
}

function compileActive(def) {
    const compileResult = compileDefinition(def);
    const activated = applyActivationOverlay(def, {
        compilable: compileResult.compilable,
        reason: compileResult.reason
    });
    activated.lookupPlans = compileResult.lookupPlans;
    return activated;
}

function snapshotFrom(defs) {
    const compiled = defs.map(compileActive);
    return buildRegistrySnapshot({
        definitions: compiled,
        diagnostics: [],
        version: 1
    });
}

const bundleComposition = definition(
    {
        code: "composition",
        base: ["Bundle"],
        type: "reference",
        expression: "Bundle.entry[0].resource",
        target: ["Composition"]
    },
    ["Bundle::composition"]
);
const bundleMessage = definition(
    {
        code: "message",
        base: ["Bundle"],
        type: "reference",
        expression: "Bundle.entry[0].resource",
        target: ["MessageHeader"]
    },
    ["Bundle::message"]
);
const compositionPatient = definition(
    {
        code: "patient",
        base: ["Composition"],
        type: "reference",
        expression: "Composition.subject",
        target: ["Patient", "Group"]
    },
    ["Composition::patient"]
);
const patientName = definition(
    {
        code: "name",
        base: ["Patient"],
        type: "string",
        expression: "Patient.name"
    },
    ["Patient::name"]
);
const groupName = definition(
    {
        code: "name",
        base: ["Group"],
        type: "string",
        expression: "Group.name"
    },
    ["Group::name"]
);
const messageFocus = definition(
    {
        code: "focus",
        base: ["MessageHeader"],
        type: "reference",
        expression: "MessageHeader.focus",
        target: ["Patient"]
    },
    ["MessageHeader::focus"]
);
const genericContained = definition(
    {
        code: "subject",
        base: ["Observation"],
        type: "reference",
        expression: "Observation.subject",
        target: ["Patient"]
    },
    ["Observation::subject"]
);

function collectLookups(stages) {
    /** @type {Array<{ from: string, pipeline: Object[] }>} */
    const found = [];
    for (const stage of stages) {
        if (stage.$lookup) {
            found.push(stage.$lookup);
            found.push(...collectLookups(stage.$lookup.pipeline || []));
        }
    }
    return found;
}

function lookupTerminalFilter(pipeline) {
    const idIndex = pipeline.findIndex((stage) => stage.$match?.$expr);
    if (idIndex === -1) {
        return undefined;
    }
    return pipeline[idIndex + 1]?.$match;
}

describe("Bundle inline relation metadata", function () {
    it("attaches canonical inline metadata for Bundle composition and message plans", function () {
        const compositionCompiled = compileDefinition(bundleComposition);
        const messageCompiled = compileDefinition(bundleMessage);
        const compositionPlan = compositionCompiled.lookupPlans["Bundle::composition"].plan;
        const messagePlan = messageCompiled.lookupPlans["Bundle::message"].plan;

        expect(compositionPlan.inlineTarget).to.deep.equal({
            mode: "embedded",
            ...CANONICAL_BUNDLE_INLINE_LOOKUPS.composition
        });
        expect(messagePlan.inlineTarget).to.deep.equal({
            mode: "embedded",
            ...CANONICAL_BUNDLE_INLINE_LOOKUPS.message
        });
    });

    it("does not attach inline metadata to a generic contained Resource extraction path", function () {
        const compiled = compileDefinition(genericContained);
        const plan = compiled.lookupPlans["Observation::subject"].plan;
        expect(plan.inlineTarget).to.equal(undefined);
        expect(
            resolveBundleInlineTarget("Observation", "subject", plan.extractionPaths, plan.targets)
        ).to.equal(undefined);
    });

    it("rejects non-canonical Bundle Resource paths for inline metadata", function () {
        const wrongPath = resolveBundleInlineTarget(
            "Bundle",
            "composition",
            [{ path: "entry.1.resource", datatype: "Resource" }],
            ["Composition"]
        );
        const wrongTarget = resolveBundleInlineTarget(
            "Bundle",
            "composition",
            [{ path: "entry.0.resource", datatype: "Resource" }],
            ["Patient"]
        );
        expect(wrongPath).to.equal(undefined);
        expect(wrongTarget).to.equal(undefined);
    });
});

describe("Bundle inline relation composer", function () {
    it("marks composition.patient as inline and counts depth and cost", function () {
        const snapshot = snapshotFrom([
            bundleComposition,
            compositionPatient,
            patientName,
            groupName
        ]);
        const sourcePlan = snapshot.byLookupKey.get("Bundle::composition").compiledPlan;
        const result = buildRelationPlan(
            sourcePlan,
            parseSearchParameterName("composition.patient.name"),
            snapshot
        );
        expect(result.valid).to.equal(true);
        expect(result.relationPlan.depth).to.equal(2);
        expect(result.relationPlan.estimatedCost).to.be.greaterThan(0);
        expect(result.relationPlan.estimatedCost).to.be.at.most(MAX_RELATION_COST);
        expect(result.relationPlan.hops[0].inline).to.deep.equal({
            mode: "embedded",
            inlinePath: "entry.0.resource",
            targetResourceType: "Composition",
            bundleTypePredicate: "document"
        });
        expect(result.relationPlan.hops[1].inline).to.equal(undefined);
        const branchTypes = result.relationPlan.hops[1].branches.map(
            (branch) => branch.targetResourceType
        );
        expect(branchTypes).to.deep.equal(["Patient", "Group"]);
    });

    it("does not create Composition or MessageHeader lookups but keeps external lookups", function () {
        const snapshot = snapshotFrom([
            bundleComposition,
            compositionPatient,
            patientName,
            groupName,
            bundleMessage,
            messageFocus,
            patientName
        ]);
        const compositionPlan = snapshot.byLookupKey.get("Bundle::composition").compiledPlan;
        const compositionRelation = buildRelationPlan(
            compositionPlan,
            parseSearchParameterName("composition.patient.name"),
            snapshot
        );
        const compositionAggregation = buildRelationAggregation(
            compositionRelation.relationPlan,
            "Roel"
        );
        const compositionLookups = collectLookups(compositionAggregation.chain[0]);
        expect(compositionLookups.some((lookup) => lookup.from === "Composition")).to.equal(false);
        expect(compositionLookups.some((lookup) => lookup.from === "Patient")).to.equal(true);
        expect(compositionLookups.some((lookup) => lookup.from === "Group")).to.equal(true);
        const compositionUnwindPaths = compositionAggregation.chain[0]
            .filter((stage) => stage.$unwind)
            .map((stage) => stage.$unwind.path);
        expect(compositionUnwindPaths).to.not.include("$entry");
        expect(compositionUnwindPaths).to.not.include("$entry.0");
        expect(compositionUnwindPaths.every((path) => path.startsWith("$entry.0.resource"))).to.equal(
            true
        );

        const messagePlan = snapshot.byLookupKey.get("Bundle::message").compiledPlan;
        const messageRelation = buildRelationPlan(
            messagePlan,
            parseSearchParameterName("message.focus:Patient.name"),
            snapshot
        );
        const messageAggregation = buildRelationAggregation(messageRelation.relationPlan, "Roel");
        const messageLookups = collectLookups(messageAggregation.chain[0]);
        expect(messageLookups.some((lookup) => lookup.from === "MessageHeader")).to.equal(false);
        expect(messageLookups.some((lookup) => lookup.from === "Patient")).to.equal(true);
        expect(messageLookups).to.have.length(1);
    });

    it("applies per-branch terminal filters for inline composition.patient.name fan-out", function () {
        const snapshot = snapshotFrom([
            bundleComposition,
            compositionPatient,
            patientName,
            groupName
        ]);
        const sourcePlan = snapshot.byLookupKey.get("Bundle::composition").compiledPlan;
        const patientNamePlan = snapshot.byLookupKey.get("Patient::name").compiledPlan;
        const groupNamePlan = snapshot.byLookupKey.get("Group::name").compiledPlan;
        const relation = buildRelationPlan(
            sourcePlan,
            parseSearchParameterName("composition.patient.name"),
            snapshot
        );
        const value = "Roel";
        const expectedPatientFilter = createTypedFilterPlan(patientNamePlan, value, "name").filter;
        const expectedGroupFilter = createTypedFilterPlan(groupNamePlan, value, "name").filter;
        const aggregation = buildRelationAggregation(relation.relationPlan, value);
        const patientLookup = aggregation.chain[0].find((stage) => stage.$lookup?.from === "Patient")
            .$lookup;
        const groupLookup = aggregation.chain[0].find((stage) => stage.$lookup?.from === "Group")
            .$lookup;
        expect(lookupTerminalFilter(patientLookup.pipeline)).to.deep.equal(expectedPatientFilter);
        expect(lookupTerminalFilter(groupLookup.pipeline)).to.deep.equal(expectedGroupFilter);
        expect(lookupTerminalFilter(patientLookup.pipeline)).to.not.deep.equal(
            lookupTerminalFilter(groupLookup.pipeline)
        );
    });

    it("still skips generic contained Resource paths and matches nothing when only Resource remains", function () {
        const snapshot = snapshotFrom([genericContained, patientName]);
        const sourcePlan = snapshot.byLookupKey.get("Observation::subject").compiledPlan;
        sourcePlan.extractionPaths = [{ path: "contained", datatype: "Resource" }];
        const relation = buildRelationPlan(
            sourcePlan,
            parseSearchParameterName("subject:Patient.name"),
            snapshot
        );
        const aggregation = buildRelationAggregation(relation.relationPlan, "Roel");
        const unwindPaths = aggregation.chain[0]
            .filter((stage) => stage.$unwind)
            .map((stage) => stage.$unwind.path);
        expect(unwindPaths).to.not.include("$contained");
        expect(aggregation.chain[0].some((stage) => stage.$lookup)).to.equal(false);
        expect(
            aggregation.chain[0].some((stage) => stage.$match?.__chainNoExecutablePath)
        ).to.equal(true);

        relation.relationPlan.hops[0].sourcePlan = {
            extractionPaths: [{ path: "contained", datatype: "Resource" }]
        };
        const onlyResourceAggregation = buildRelationAggregation(relation.relationPlan, "Roel");
        expect(onlyResourceAggregation.chain[0].some((stage) => stage.$lookup)).to.equal(false);
        expect(
            onlyResourceAggregation.chain[0].some(
                (stage) => stage.$match?.__chainNoExecutablePath
            )
        ).to.equal(true);
    });
});
