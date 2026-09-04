require("module-alias/register");

const { expect } = require("chai");
const fhirResourceCatalog = require("@models/FHIR/fhir.resourceList.json");
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
    MAX_RELATION_DEPTH,
    buildRelationPlan,
    buildRelationAggregation
} = require("@models/FHIR/searchParameter/executor/relationPlan");
const { bundleInlineGatingConditions } = require("@models/FHIR/searchParameter/executor/bundleInlineDirectFilter");

const RELATION_LIMIT_CLASSES = ["missing-type-filter", "relation-depth", "relation-cost"];

/**
 * @param {{ valid: boolean, class?: string }} result
 */
function expectUnknownClass(result) {
    expect(result.valid).to.equal(false);
    expect(result.class).to.equal("unknown");
    for (const limitClass of RELATION_LIMIT_CLASSES) {
        expect(result.class).to.not.equal(limitClass);
    }
    expect(JSON.stringify(result)).to.not.include("Relation cost exceeds allowed limit");
}

/**
 * @param {{ valid: boolean, class?: string }} result
 * @param {string} limitClass
 */
function expectLimitClass(result, limitClass) {
    expect(result.valid).to.equal(false);
    expect(result.class).to.equal(limitClass);
    expect(result.class).to.not.equal("unknown");
    for (const otherClass of RELATION_LIMIT_CLASSES) {
        if (otherClass !== limitClass) {
            expect(result.class).to.not.equal(otherClass);
        }
    }
}

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
const messageFocusOpen = definition(
    {
        code: "focus",
        base: ["MessageHeader"],
        type: "reference",
        expression: "MessageHeader.focus",
        target: []
    },
    ["MessageHeader::focus"]
);
const patientOrganization = definition(
    {
        code: "organization",
        base: ["Patient"],
        type: "reference",
        expression: "Patient.managingOrganization",
        target: ["Organization"]
    },
    ["Patient::organization"]
);
const organizationName = definition(
    {
        code: "name",
        base: ["Organization"],
        type: "string",
        expression: "Organization.name"
    },
    ["Organization::name"]
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

function collectUnwindPaths(stages) {
    /** @type {string[]} */
    const paths = [];
    for (const stage of stages) {
        if (stage.$unwind) {
            paths.push(stage.$unwind.path);
        }
        if (stage.$lookup) {
            paths.push(...collectUnwindPaths(stage.$lookup.pipeline || []));
        }
    }
    return paths;
}

function collectLookupRefValues(stages) {
    /** @type {string[]} */
    const values = [];
    for (const stage of stages) {
        if (stage.$lookup?.let?.refValue) {
            values.push(stage.$lookup.let.refValue);
        }
        if (stage.$lookup) {
            values.push(...collectLookupRefValues(stage.$lookup.pipeline || []));
        }
    }
    return values;
}

function collectPlainMatchKeys(stages) {
    /** @type {string[]} */
    const keys = [];
    for (const stage of stages) {
        if (
            stage.$match &&
            !stage.$match.$and &&
            !stage.$match.$expr &&
            !stage.$match.__chainNoExecutablePath
        ) {
            keys.push(...Object.keys(stage.$match));
        }
        if (stage.$lookup) {
            keys.push(...collectPlainMatchKeys(stage.$lookup.pipeline || []));
        }
    }
    return keys;
}

function snapshotFromCompiled(definitions) {
    return buildRegistrySnapshot({
        definitions,
        diagnostics: [],
        version: 1
    });
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

    it("rejects message.focus.name without a type filter for open targets", function () {
        const snapshot = snapshotFrom([bundleMessage, messageFocusOpen, patientName]);
        const sourcePlan = snapshot.byLookupKey.get("Bundle::message").compiledPlan;
        const result = buildRelationPlan(
            sourcePlan,
            parseSearchParameterName("message.focus.name"),
            snapshot
        );
        expectLimitClass(result, "missing-type-filter");
        expect(result.reason).to.equal(undefined);
        expect(JSON.stringify(result)).to.not.include("Relation cost exceeds allowed limit");
    });

    it("applies Bundle gating at the start of inline aggregation pipelines", function () {
        const snapshot = snapshotFrom([
            bundleComposition,
            compositionPatient,
            patientName,
            groupName
        ]);
        const sourcePlan = snapshot.byLookupKey.get("Bundle::composition").compiledPlan;
        const relation = buildRelationPlan(
            sourcePlan,
            parseSearchParameterName("composition.patient.name"),
            snapshot
        );
        const aggregation = buildRelationAggregation(relation.relationPlan, "Roel");
        const gatingStage = aggregation.chain[0][0];
        expect(gatingStage.$match.$and).to.deep.equal(
            bundleInlineGatingConditions(sourcePlan.inlineTarget)
        );
    });

    it("nests external lookups for composition.patient:Patient.organization.name", function () {
        const snapshot = snapshotFrom([
            bundleComposition,
            compositionPatient,
            patientOrganization,
            organizationName,
            groupName
        ]);
        const sourcePlan = snapshot.byLookupKey.get("Bundle::composition").compiledPlan;
        const organizationNamePlan = snapshot.byLookupKey.get("Organization::name").compiledPlan;
        const relation = buildRelationPlan(
            sourcePlan,
            parseSearchParameterName("composition.patient:Patient.organization.name"),
            snapshot
        );
        expect(relation.valid).to.equal(true);
        expect(relation.relationPlan.depth).to.equal(3);
        expect(relation.relationPlan.depth).to.equal(MAX_RELATION_DEPTH);
        const value = "Acme";
        const expectedFilter = createTypedFilterPlan(organizationNamePlan, value, "name").filter;
        const aggregation = buildRelationAggregation(relation.relationPlan, value);
        const pipeline = aggregation.chain[0];
        expect(collectLookups(pipeline).some((lookup) => lookup.from === "Composition")).to.equal(
            false
        );
        expect(collectLookups(pipeline).some((lookup) => lookup.from === "MessageHeader")).to.equal(
            false
        );
        const patientLookup = pipeline.find((stage) => stage.$lookup?.from === "Patient").$lookup;
        const orgLookup = collectLookups(patientLookup.pipeline).find(
            (lookup) => lookup.from === "Organization"
        );
        expect(orgLookup).to.exist;
        expect(lookupTerminalFilter(orgLookup.pipeline)).to.deep.equal(expectedFilter);
        expect(collectLookups(pipeline).some((lookup) => lookup.from === "Group")).to.equal(false);
    });

    it("prefixes inline terminal reference filters to entry.0.resource", function () {
        const snapshot = snapshotFrom([bundleComposition, compositionPatient]);
        const sourcePlan = snapshot.byLookupKey.get("Bundle::composition").compiledPlan;
        const relation = buildRelationPlan(
            sourcePlan,
            parseSearchParameterName("composition.patient"),
            snapshot
        );
        const aggregation = buildRelationAggregation(relation.relationPlan, "Patient/p1");
        const pipeline = aggregation.chain[0];
        expect(pipeline[0].$match.$and).to.deep.equal(
            bundleInlineGatingConditions(sourcePlan.inlineTarget)
        );
        expect(collectLookups(pipeline)).to.have.length(0);
        const terminalMatch = pipeline.find(
            (stage) => stage.$match && !stage.$match.$and && !stage.$match.__chainNoExecutablePath
        );
        expect(terminalMatch).to.exist;
        expect(JSON.stringify(terminalMatch.$match)).to.include("entry.0.resource");
        expect(JSON.stringify(terminalMatch.$match)).to.not.include('"entry"');
    });

    it("rejects inline relation depth above the module limit", function () {
        const snapshot = snapshotFrom([
            bundleComposition,
            compositionPatient,
            patientOrganization,
            organizationName
        ]);
        const sourcePlan = snapshot.byLookupKey.get("Bundle::composition").compiledPlan;
        const result = buildRelationPlan(
            sourcePlan,
            parseSearchParameterName("composition.patient.organization.partof.name"),
            snapshot
        );
        expectLimitClass(result, "relation-depth");
        expect(result.relationPlan).to.equal(undefined);
        expect(JSON.stringify(result)).to.not.include("Relation depth exceeds allowed limit");
    });

    it("rejects inline relation cost above the module limit", function () {
        const targetTypes = [
            "Patient",
            "Group",
            "Practitioner",
            "Organization",
            "Location",
            "Person",
            "CareTeam"
        ];
        const multiPatient = definition(
            {
                code: "patient-multi",
                base: ["Composition"],
                type: "reference",
                expression: "Composition.subject",
                target: targetTypes
            },
            ["Composition::patient-multi"]
        );
        const targetDefinitions = targetTypes.map((targetType) =>
            definition(
                {
                    code: "name",
                    base: [targetType],
                    type: "string",
                    expression: `${targetType}.name`
                },
                [`${targetType}::name`]
            )
        );
        const snapshot = snapshotFrom([bundleComposition, multiPatient, ...targetDefinitions]);
        const sourcePlan = snapshot.byLookupKey.get("Bundle::composition").compiledPlan;
        const result = buildRelationPlan(
            sourcePlan,
            parseSearchParameterName("composition.patient-multi.name"),
            snapshot
        );
        expectLimitClass(result, "relation-cost");
        expect(JSON.stringify(result)).to.not.include("Relation cost exceeds allowed limit");
    });

    it("returns unknown for undeclared inline chained lookups", function () {
        const snapshot = snapshotFrom([bundleComposition, compositionPatient, patientName]);
        const sourcePlan = snapshot.byLookupKey.get("Bundle::composition").compiledPlan;
        const result = buildRelationPlan(
            sourcePlan,
            parseSearchParameterName("composition.unknown.name"),
            snapshot
        );
        expectUnknownClass(result);
    });

    it("rejects open catalog-minus-one inline hops when the type filter is not listed", function () {
        const catalogMinusOneFocus = definition(
            {
                code: "focus",
                base: ["MessageHeader"],
                type: "reference",
                expression: "MessageHeader.focus",
                target: fhirResourceCatalog.filter((_, index) => index !== 0)
            },
            ["MessageHeader::focus"]
        );
        const missingType = fhirResourceCatalog.find(
            (type) => !catalogMinusOneFocus.resource.target.includes(type)
        );
        const snapshot = snapshotFrom([bundleMessage, catalogMinusOneFocus, patientName]);
        const sourcePlan = snapshot.byLookupKey.get("Bundle::message").compiledPlan;
        const result = buildRelationPlan(
            sourcePlan,
            parseSearchParameterName(`message.focus:${missingType}.name`),
            snapshot
        );
        expectUnknownClass(result);
    });

    it("fans out message.focus:Patient.name for catalog-like MessageHeader::focus targets", function () {
        const catalogLikeFocus = definition(
            {
                code: "focus",
                base: ["MessageHeader"],
                type: "reference",
                expression: "MessageHeader.focus",
                target: fhirResourceCatalog.filter((_, index) => index !== 0)
            },
            ["MessageHeader::focus"]
        );
        const snapshot = snapshotFrom([bundleMessage, catalogLikeFocus, patientName]);
        const messagePlan = snapshot.byLookupKey.get("Bundle::message").compiledPlan;
        const patientNamePlan = snapshot.byLookupKey.get("Patient::name").compiledPlan;
        const relation = buildRelationPlan(
            messagePlan,
            parseSearchParameterName("message.focus:Patient.name"),
            snapshot
        );
        expect(relation.valid).to.equal(true);
        expect(relation.relationPlan.hops[1].branches).to.have.length(1);
        expect(relation.relationPlan.hops[1].branches[0].targetResourceType).to.equal("Patient");

        const value = "Roel";
        const expectedFilter = createTypedFilterPlan(patientNamePlan, value, "name").filter;
        const aggregation = buildRelationAggregation(relation.relationPlan, value);
        const lookups = collectLookups(aggregation.chain[0]);
        expect(lookups.some((lookup) => lookup.from === "MessageHeader")).to.equal(false);
        expect(lookups.some((lookup) => lookup.from === "Patient")).to.equal(true);
        expect(lookups).to.have.length(1);

        const patientLookup = aggregation.chain[0].find((stage) => stage.$lookup?.from === "Patient")
            .$lookup;
        expect(lookupTerminalFilter(patientLookup.pipeline)).to.deep.equal(expectedFilter);
    });

    it("keeps correlated inline focus guards scoped to entry.0.resource.focus", function () {
        const messageFocusCorrelated = compileActive(
            definition(
                {
                    code: "focus",
                    base: ["MessageHeader"],
                    type: "reference",
                    expression: "MessageHeader.focus",
                    target: ["Patient"]
                },
                ["MessageHeader::focus"]
            )
        );
        messageFocusCorrelated.lookupPlans["MessageHeader::focus"].plan.extractionPaths = [
            {
                path: "focus",
                datatype: "Reference",
                predicates: [{ kind: "typeEquals", value: "Patient" }],
                correlation: {
                    kind: "same-array-element",
                    parentPath: "focus",
                    fields: ["type", "reference"]
                }
            }
        ];
        const snapshot = snapshotFromCompiled([
            compileActive(bundleMessage),
            messageFocusCorrelated,
            compileActive(patientName)
        ]);
        const messagePlan = snapshot.byLookupKey.get("Bundle::message").compiledPlan;
        const relation = buildRelationPlan(
            messagePlan,
            parseSearchParameterName("message.focus:Patient.name"),
            snapshot
        );
        expect(relation.valid).to.equal(true);

        const aggregation = buildRelationAggregation(relation.relationPlan, "Roel");
        const pipeline = aggregation.chain[0];
        const unwindPaths = collectUnwindPaths(pipeline);
        expect(unwindPaths).to.not.include("$entry");
        expect(unwindPaths).to.include("$entry.0.resource.focus");
        expect(unwindPaths.every((path) => path.startsWith("$entry.0.resource"))).to.equal(true);

        const matchKeys = collectPlainMatchKeys(pipeline);
        expect(matchKeys).to.include("entry.0.resource.focus.type");
        expect(matchKeys).to.not.include("entry.type");
        expect(matchKeys).to.not.include("entry.0.type");
        expect(matchKeys).to.not.include("focus.type");

        const refValues = collectLookupRefValues(pipeline);
        expect(refValues).to.include("$entry.0.resource.focus.reference");
        expect(refValues).to.not.include("$focus.reference");
        expect(refValues).to.not.include("$entry.reference");
    });
});
