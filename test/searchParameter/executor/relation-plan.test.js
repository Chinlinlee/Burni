require("module-alias/register");

const { expect } = require("chai");
const fhirResourceCatalog = require("@models/FHIR/fhir.resourceList.json");
const { compileDefinition } = require("@models/FHIR/searchParameter/compiler/compiler");
const { applyActivationOverlay } = require("@models/FHIR/searchParameter/registry/activationPolicy");
const { buildRegistrySnapshot } = require("@models/FHIR/searchParameter/registry/snapshot");
const { parseSearchParameterName } = require("@models/FHIR/searchParameter/runtime/parameterName");
const { createTypedFilterPlan } = require("@models/FHIR/searchParameter/executor/queryValueParser");
const {
    MAX_RELATION_DEPTH,
    MAX_RELATION_COST,
    buildRelationPlan,
    buildRelationAggregation,
    isOpenReferenceTarget
} = require("@models/FHIR/searchParameter/executor/relationPlan");

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
    expect(JSON.stringify(result)).to.not.include("Recursive chain is not supported");
    expect(JSON.stringify(result)).to.not.include("Relation cycle is not allowed");
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

const observationSubject = definition(
    {
        code: "subject",
        base: ["Observation"],
        type: "reference",
        expression: "Observation.subject",
        target: ["Patient", "Group"]
    },
    ["Observation::subject"]
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
const organizationPartof = definition(
    {
        code: "partof",
        base: ["Organization"],
        type: "reference",
        expression: "Organization.partOf",
        target: ["Organization"]
    },
    ["Organization::partof"]
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

describe("isOpenReferenceTarget", function () {
    it("treats empty targets, Resource token, and catalog-minus-one as open", function () {
        expect(isOpenReferenceTarget([])).to.equal(true);
        expect(isOpenReferenceTarget(["Resource"])).to.equal(true);
        expect(isOpenReferenceTarget(["Patient", "Resource"])).to.equal(true);
        const catalogMinusOne = fhirResourceCatalog.filter((_, index) => index !== 0);
        expect(catalogMinusOne.length).to.equal(fhirResourceCatalog.length - 1);
        expect(isOpenReferenceTarget(catalogMinusOne)).to.equal(true);
    });

    it("does not treat a small closed target list as open", function () {
        expect(isOpenReferenceTarget(["Patient", "Group", "Practitioner"])).to.equal(false);
    });
});

describe("bounded multihop relation composer", function () {
    it("builds a one-hop relation path with per-type branches", function () {
        const snapshot = snapshotFrom([observationSubject, patientName, groupName]);
        const sourcePlan = snapshot.byLookupKey.get("Observation::subject").compiledPlan;
        const parsed = parseSearchParameterName("subject.name");
        const result = buildRelationPlan(sourcePlan, parsed, snapshot);
        expect(result.valid).to.equal(true);
        expect(result.relationPlan.depth).to.equal(1);
        expect(result.relationPlan.depth).to.not.equal(MAX_RELATION_DEPTH);
        expect(result.relationPlan.hops).to.have.length(1);
        expect(result.relationPlan.hops[0].code).to.equal("subject");
        expect(result.relationPlan.terminal.code).to.equal("name");
        const branchTypes = result.relationPlan.hops[0].branches.map((branch) => branch.targetResourceType);
        expect(branchTypes).to.deep.equal(["Patient", "Group"]);
        expect(result.relationPlan.hops[0].branches[0].targetPlan.code).to.equal("name");
        expect(result.relationPlan.hops[0].branches[1].targetPlan.code).to.equal("name");
        expect(result.relationPlan.hops[0].branches[0].targetPlan).to.not.equal(
            result.relationPlan.hops[0].branches[1].targetPlan
        );
        expect(result.relationPlan.estimatedCost).to.equal(8);
        expect(result.relationPlan.estimatedCost).to.be.at.most(MAX_RELATION_COST);
    });

    it("honors a type filter on the first hop", function () {
        const snapshot = snapshotFrom([observationSubject, patientName, groupName]);
        const sourcePlan = snapshot.byLookupKey.get("Observation::subject").compiledPlan;
        const parsed = parseSearchParameterName("subject:Patient.name");
        const result = buildRelationPlan(sourcePlan, parsed, snapshot);
        expect(result.valid).to.equal(true);
        expect(result.relationPlan.hops[0].typeFilter).to.equal("Patient");
        expect(result.relationPlan.hops[0].branches).to.have.length(1);
        expect(result.relationPlan.hops[0].branches[0].targetResourceType).to.equal("Patient");
    });

    it("returns unknown when no declared target has an effective next-hop lookup", function () {
        const snapshot = snapshotFrom([observationSubject, patientName, groupName]);
        const sourcePlan = snapshot.byLookupKey.get("Observation::subject").compiledPlan;
        const result = buildRelationPlan(
            sourcePlan,
            parseSearchParameterName("subject.organization.name"),
            snapshot
        );
        expectUnknownClass(result);
        expect(result.relationPlan).to.equal(undefined);
    });

    it("rejects non-reference chaining, unknown lookup, and undeclared closed type filter", function () {
        const snapshot = snapshotFrom([observationSubject, patientName]);
        const sourcePlan = snapshot.byLookupKey.get("Observation::subject").compiledPlan;

        const nonReference = buildRelationPlan(
            sourcePlan,
            parseSearchParameterName("subject.name.family"),
            snapshot
        );
        expectUnknownClass(nonReference);

        const undeclaredWithFilter = buildRelationPlan(
            sourcePlan,
            parseSearchParameterName("subject:Practitioner.name"),
            snapshot
        );
        expectUnknownClass(undeclaredWithFilter);

        const unknownHop = buildRelationPlan(
            sourcePlan,
            parseSearchParameterName("subject.not-a-param"),
            snapshot
        );
        expectUnknownClass(unknownHop);
    });

    it("allows a one-hop partof relation", function () {
        const snapshot = snapshotFrom([organizationPartof, organizationName]);
        const sourcePlan = snapshot.byLookupKey.get("Organization::partof").compiledPlan;
        const result = buildRelationPlan(
            sourcePlan,
            parseSearchParameterName("partof.name"),
            snapshot
        );
        expect(result.valid).to.equal(true);
        expect(result.relationPlan.depth).to.equal(1);
        expect(result.relationPlan.hops[0].branches[0].targetResourceType).to.equal("Organization");
    });

    it("allows a self-referencing subject hop when the target lookup exists", function () {
        const looping = definition(
            {
                code: "subject",
                base: ["Observation"],
                type: "reference",
                expression: "Observation.subject",
                target: ["Observation"]
            },
            ["Observation::subject"]
        );
        const observationCode = definition(
            {
                code: "code",
                base: ["Observation"],
                type: "token",
                expression: "Observation.code"
            },
            ["Observation::code"]
        );
        const loopSnapshot = snapshotFrom([looping, observationCode]);
        const loopPlan = loopSnapshot.byLookupKey.get("Observation::subject").compiledPlan;
        const result = buildRelationPlan(
            loopPlan,
            parseSearchParameterName("subject.subject"),
            loopSnapshot
        );
        expect(result.valid).to.equal(true);
        expect(result.relationPlan.hops[0].branches[0].targetResourceType).to.equal("Observation");
    });

    it("rejects an explicit chain list that does not include the requested parameter", function () {
        const chained = definition(
            {
                code: "subject",
                base: ["Observation"],
                type: "reference",
                expression: "Observation.subject",
                target: ["Patient"],
                chain: ["identifier"]
            },
            ["Observation::subject"]
        );
        const snapshot = snapshotFrom([chained, patientName]);
        const sourcePlan = snapshot.byLookupKey.get("Observation::subject").compiledPlan;
        const result = buildRelationPlan(
            sourcePlan,
            parseSearchParameterName("subject.name"),
            snapshot
        );
        expect(result.valid).to.equal(false);
        expectUnknownClass(result);
    });

    it("builds a two-hop relation path for subject.organization.name", function () {
        const snapshot = snapshotFrom([
            observationSubject,
            patientOrganization,
            organizationName,
            groupName
        ]);
        const sourcePlan = snapshot.byLookupKey.get("Observation::subject").compiledPlan;
        const result = buildRelationPlan(
            sourcePlan,
            parseSearchParameterName("subject.organization.name"),
            snapshot
        );
        expect(result.valid).to.equal(true);
        expect(result.relationPlan.depth).to.equal(2);
        expect(result.relationPlan.hops).to.have.length(2);
        expect(result.relationPlan.hops[0].branches).to.have.length(1);
        expect(result.relationPlan.hops[0].branches[0].targetResourceType).to.equal("Patient");
        expect(result.relationPlan.hops[1].code).to.equal("organization");
        expect(result.relationPlan.hops[1].branches[0].targetResourceType).to.equal("Organization");
        expect(result.relationPlan.hops[1].branches[0].targetPlan.code).to.equal("name");
    });

    it("builds a two-hop partof.partof.name path", function () {
        const snapshot = snapshotFrom([organizationPartof, organizationName]);
        const sourcePlan = snapshot.byLookupKey.get("Organization::partof").compiledPlan;
        const result = buildRelationPlan(
            sourcePlan,
            parseSearchParameterName("partof.partof.name"),
            snapshot
        );
        expect(result.valid).to.equal(true);
        expect(result.relationPlan.depth).to.equal(2);
        expect(result.relationPlan.hops[1].branches[0].targetPlan.code).to.equal("name");
    });

    it("honors an intermediate hop type filter", function () {
        const snapshot = snapshotFrom([
            observationSubject,
            patientOrganization,
            organizationName,
            groupName
        ]);
        const sourcePlan = snapshot.byLookupKey.get("Observation::subject").compiledPlan;
        const result = buildRelationPlan(
            sourcePlan,
            parseSearchParameterName("subject:Patient.organization.name"),
            snapshot
        );
        expect(result.valid).to.equal(true);
        expect(result.relationPlan.hops[0].typeFilter).to.equal("Patient");
        expect(result.relationPlan.hops[0].branches).to.have.length(1);
        expect(result.relationPlan.hops[0].branches[0].targetResourceType).to.equal("Patient");
    });

    it("rejects open hops without a type filter before cost", function () {
        const emptyTargets = definition(
            {
                code: "subject-open-empty",
                base: ["Observation"],
                type: "reference",
                expression: "Observation.subject",
                target: []
            },
            ["Observation::subject-open-empty"]
        );
        const resourceToken = definition(
            {
                code: "subject-open-resource",
                base: ["Observation"],
                type: "reference",
                expression: "Observation.subject",
                target: ["Resource"]
            },
            ["Observation::subject-open-resource"]
        );
        const catalogMinusOne = definition(
            {
                code: "subject-open-catalog",
                base: ["Observation"],
                type: "reference",
                expression: "Observation.subject",
                target: fhirResourceCatalog.filter((_, index) => index !== 0)
            },
            ["Observation::subject-open-catalog"]
        );
        const snapshot = snapshotFrom([emptyTargets, resourceToken, catalogMinusOne, patientName]);
        const cases = [
            ["Observation::subject-open-empty", "subject-open-empty.name"],
            ["Observation::subject-open-resource", "subject-open-resource.name"],
            ["Observation::subject-open-catalog", "subject-open-catalog.name"]
        ];
        for (const [lookupKey, parameterName] of cases) {
            const sourcePlan = snapshot.byLookupKey.get(lookupKey).compiledPlan;
            const result = buildRelationPlan(
                sourcePlan,
                parseSearchParameterName(parameterName),
                snapshot
            );
            expect(result.valid).to.equal(false);
            expect(result.class).to.equal("missing-type-filter");
            expect(result.reason).to.equal(undefined);
        }
    });

    it("looks up only the filtered type for an open hop with empty targets", function () {
        const emptyTargets = definition(
            {
                code: "subject",
                base: ["Composition"],
                type: "reference",
                expression: "Composition.subject",
                target: []
            },
            ["Composition::subject"]
        );
        const snapshot = snapshotFrom([emptyTargets, patientName]);
        const sourcePlan = snapshot.byLookupKey.get("Composition::subject").compiledPlan;
        const result = buildRelationPlan(
            sourcePlan,
            parseSearchParameterName("subject:Patient.name"),
            snapshot
        );
        expect(result.valid).to.equal(true);
        expect(result.relationPlan.hops[0].branches).to.have.length(1);
        expect(result.relationPlan.hops[0].branches[0].targetResourceType).to.equal("Patient");
    });

    it("looks up only the filtered type for a Resource-token open hop", function () {
        const resourceTokenSubject = definition(
            {
                code: "subject",
                base: ["Composition"],
                type: "reference",
                expression: "Composition.subject",
                target: ["Resource"]
            },
            ["Composition::subject"]
        );
        const snapshot = snapshotFrom([resourceTokenSubject, patientName, groupName]);
        const sourcePlan = snapshot.byLookupKey.get("Composition::subject").compiledPlan;
        expect(isOpenReferenceTarget(sourcePlan.targets)).to.equal(true);

        const result = buildRelationPlan(
            sourcePlan,
            parseSearchParameterName("subject:Patient.name"),
            snapshot
        );
        expect(result.valid).to.equal(true);
        expect(result.relationPlan.hops[0].typeFilter).to.equal("Patient");
        expect(result.relationPlan.hops[0].branches).to.have.length(1);
        expect(result.relationPlan.hops[0].branches[0].targetResourceType).to.equal("Patient");

        const aggregation = buildRelationAggregation(result.relationPlan, "Roel");
        const lookups = collectLookups(aggregation.chain[0]);
        expect(lookups).to.have.length(1);
        expect(lookups[0].from).to.equal("Patient");
        expect(lookups.some((lookup) => lookup.from === "Group")).to.equal(false);
    });

    it("rejects a catalog-minus-one open hop when the type filter is not listed", function () {
        const catalogMinusOne = definition(
            {
                code: "subject-open-catalog",
                base: ["Observation"],
                type: "reference",
                expression: "Observation.subject",
                target: fhirResourceCatalog.filter((_, index) => index !== 0)
            },
            ["Observation::subject-open-catalog"]
        );
        const missingType = fhirResourceCatalog.find(
            (type) => !catalogMinusOne.resource.target.includes(type)
        );
        const snapshot = snapshotFrom([catalogMinusOne, patientName]);
        const sourcePlan = snapshot.byLookupKey.get("Observation::subject-open-catalog").compiledPlan;
        const result = buildRelationPlan(
            sourcePlan,
            parseSearchParameterName(`subject-open-catalog:${missingType}.name`),
            snapshot
        );
        expect(result.valid).to.equal(false);
        expectUnknownClass(result);
    });

    it("rejects an open hop missing a type filter before checking depth", function () {
        const emptyTargets = definition(
            {
                code: "subject",
                base: ["Composition"],
                type: "reference",
                expression: "Composition.subject",
                target: []
            },
            ["Composition::subject"]
        );
        const snapshot = snapshotFrom([emptyTargets, patientName]);
        const sourcePlan = snapshot.byLookupKey.get("Composition::subject").compiledPlan;
        const result = buildRelationPlan(
            sourcePlan,
            parseSearchParameterName("subject.a.b.c.d"),
            snapshot
        );
        expect(result.valid).to.equal(false);
        expect(result.class).to.equal("missing-type-filter");
    });

    it("rejects relation depth above the module limit", function () {
        const snapshot = snapshotFrom([observationSubject, patientName]);
        const sourcePlan = snapshot.byLookupKey.get("Observation::subject").compiledPlan;
        const result = buildRelationPlan(
            sourcePlan,
            parseSearchParameterName("a.b.c.d.e"),
            snapshot
        );
        expect(result.valid).to.equal(false);
        expectLimitClass(result, "relation-depth");
        expect(result.relationPlan).to.equal(undefined);
    });

    it("rejects one-hop fan-out when path cost exceeds the module limit", function () {
        const targetTypes = [
            "Patient",
            "Group",
            "Practitioner",
            "Organization",
            "Location",
            "Person",
            "CareTeam"
        ];
        const multiTarget = definition(
            {
                code: "subject",
                base: ["Observation"],
                type: "reference",
                expression: "Observation.subject",
                target: targetTypes
            },
            ["Observation::subject"]
        );
        const targetDefinitions = targetTypes.map((targetType, index) =>
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
        const snapshot = snapshotFrom([multiTarget, ...targetDefinitions]);
        const sourcePlan = snapshot.byLookupKey.get("Observation::subject").compiledPlan;
        const result = buildRelationPlan(
            sourcePlan,
            parseSearchParameterName("subject.name"),
            snapshot
        );
        expect(result.valid).to.equal(false);
        expectLimitClass(result, "relation-cost");
        expect(JSON.stringify(result)).to.not.include("Relation cost exceeds allowed limit");
        expect(JSON.stringify(result)).to.not.include("Recursive chain is not supported");
        expect(JSON.stringify(result)).to.not.include("Relation cycle is not allowed");
    });

    it("rejects depth-3 fan-out when path cost exceeds the module limit", function () {
        const targetTypes = ["Patient", "Group", "Organization", "Location"];
        const multiTarget = definition(
            {
                code: "subject",
                base: ["Observation"],
                type: "reference",
                expression: "Observation.subject",
                target: targetTypes
            },
            ["Observation::subject"]
        );
        const organizationLinks = [
            definition(
                {
                    code: "organization",
                    base: ["Patient"],
                    type: "reference",
                    expression: "Patient.managingOrganization",
                    target: ["Organization"]
                },
                ["Patient::organization"]
            ),
            definition(
                {
                    code: "organization",
                    base: ["Group"],
                    type: "reference",
                    expression: "Group.managingEntity",
                    target: ["Organization", "Practitioner", "RelatedPerson"]
                },
                ["Group::organization"]
            ),
            definition(
                {
                    code: "organization",
                    base: ["Organization"],
                    type: "reference",
                    expression: "Organization.partOf",
                    target: ["Organization"]
                },
                ["Organization::organization"]
            ),
            definition(
                {
                    code: "organization",
                    base: ["Location"],
                    type: "reference",
                    expression: "Location.partOf",
                    target: ["Organization", "Location"]
                },
                ["Location::organization"]
            )
        ];
        const snapshot = snapshotFrom([
            multiTarget,
            ...organizationLinks,
            organizationPartof,
            organizationName
        ]);
        const sourcePlan = snapshot.byLookupKey.get("Observation::subject").compiledPlan;
        const result = buildRelationPlan(
            sourcePlan,
            parseSearchParameterName("subject.organization.partof.name"),
            snapshot
        );
        expect(result.valid).to.equal(false);
        expectLimitClass(result, "relation-cost");
        expect(result.relationPlan).to.equal(undefined);
        expect(JSON.stringify(result)).to.not.include("Relation cost exceeds allowed limit");
    });

    it("builds a depth-3 relation path within the module depth and cost limits", function () {
        const snapshot = snapshotFrom([
            observationSubject,
            patientOrganization,
            organizationPartof,
            organizationName,
            groupName
        ]);
        const sourcePlan = snapshot.byLookupKey.get("Observation::subject").compiledPlan;
        const result = buildRelationPlan(
            sourcePlan,
            parseSearchParameterName("subject:Patient.organization.partof.name"),
            snapshot
        );
        expect(result.valid).to.equal(true);
        expect(result.relationPlan.depth).to.equal(3);
        expect(result.relationPlan.depth).to.equal(MAX_RELATION_DEPTH);
        expect(result.relationPlan.estimatedCost).to.be.at.most(MAX_RELATION_COST);
        expect(result.relationPlan.hops).to.have.length(3);
    });

    it("allows absent or empty chain allowlists to continue effective next hops", function () {
        const absentSnapshot = snapshotFrom([observationSubject, patientName, groupName]);
        const absentPlan = absentSnapshot.byLookupKey.get("Observation::subject").compiledPlan;
        expect(
            buildRelationPlan(
                absentPlan,
                parseSearchParameterName("subject.name"),
                absentSnapshot
            ).valid
        ).to.equal(true);

        const emptyChainHop = definition(
            {
                code: "parent",
                base: ["Organization"],
                type: "reference",
                expression: "Organization.partOf",
                target: ["Organization"],
                chain: []
            },
            ["Organization::parent"]
        );
        const emptyChainSnapshot = snapshotFrom([emptyChainHop, organizationName]);
        const emptyChainPlan = emptyChainSnapshot.byLookupKey.get("Organization::parent").compiledPlan;
        expect(
            buildRelationPlan(
                emptyChainPlan,
                parseSearchParameterName("parent.name"),
                emptyChainSnapshot
            ).valid
        ).to.equal(true);
    });

    it("allows a non-empty chain allowlist when the next hop is listed", function () {
        const chained = definition(
            {
                code: "subject",
                base: ["Observation"],
                type: "reference",
                expression: "Observation.subject",
                target: ["Patient"],
                chain: ["name"]
            },
            ["Observation::subject"]
        );
        const snapshot = snapshotFrom([chained, patientName]);
        const sourcePlan = snapshot.byLookupKey.get("Observation::subject").compiledPlan;
        const result = buildRelationPlan(
            sourcePlan,
            parseSearchParameterName("subject.name"),
            snapshot
        );
        expect(result.valid).to.equal(true);
        expect(result.relationPlan.terminal.code).to.equal("name");
    });

    it("returns unknown for disabled lookups", function () {
        const disabledName = definition(
            {
                code: "name",
                base: ["Patient"],
                type: "string",
                expression: "Patient.name"
            },
            ["Patient::name"]
        );
        const compiledDisabledName = compileActive(disabledName);
        compiledDisabledName.lookupPlans["Patient::name"] = {
            compilable: false,
            reason: "disabled for test"
        };
        const compiledObservation = compileActive(observationSubject);
        const snapshot = buildRegistrySnapshot({
            definitions: [compiledObservation, compiledDisabledName],
            diagnostics: [],
            version: 1
        });
        const sourcePlan = snapshot.byLookupKey.get("Observation::subject").compiledPlan;
        const result = buildRelationPlan(
            sourcePlan,
            parseSearchParameterName("subject.name"),
            snapshot
        );
        expect(result.valid).to.equal(false);
        expectUnknownClass(result);
    });

    it("builds a bounded $lookup aggregation from hop branches", function () {
        const snapshot = snapshotFrom([observationSubject, patientName]);
        const sourcePlan = snapshot.byLookupKey.get("Observation::subject").compiledPlan;
        const relation = buildRelationPlan(
            sourcePlan,
            parseSearchParameterName("subject:Patient.name"),
            snapshot
        );
        const aggregation = buildRelationAggregation(relation.relationPlan, "Roel");
        expect(aggregation.isChain).to.equal(true);
        expect(aggregation.chain[0].some((stage) => stage.$lookup?.from === "Patient")).to.equal(true);
        expect(JSON.stringify(aggregation.chain[0])).to.include("$unwind");
        expect(JSON.stringify(aggregation.chain[0])).to.include("$match");
    });

    it("nests $lookup pipelines for a two-hop subject.organization.name chain", function () {
        const snapshot = snapshotFrom([
            observationSubject,
            patientOrganization,
            organizationName,
            groupName
        ]);
        const sourcePlan = snapshot.byLookupKey.get("Observation::subject").compiledPlan;
        const organizationNamePlan = snapshot.byLookupKey.get("Organization::name").compiledPlan;
        const relation = buildRelationPlan(
            sourcePlan,
            parseSearchParameterName("subject:Patient.organization.name"),
            snapshot
        );
        const value = "Acme";
        const expectedFilter = createTypedFilterPlan(organizationNamePlan, value, "name").filter;
        const aggregation = buildRelationAggregation(relation.relationPlan, value);
        const pipeline = aggregation.chain[0];
        const patientLookup = pipeline.find((stage) => stage.$lookup?.from === "Patient").$lookup;
        const orgLookup = collectLookups(patientLookup.pipeline).find((lookup) => lookup.from === "Organization");
        expect(orgLookup).to.exist;
        expect(lookupTerminalFilter(orgLookup.pipeline)).to.deep.equal(expectedFilter);
        expect(lookupTerminalFilter(patientLookup.pipeline)).to.equal(undefined);
    });

    it("nests Organization lookups for partof.partof.name", function () {
        const snapshot = snapshotFrom([organizationPartof, organizationName]);
        const sourcePlan = snapshot.byLookupKey.get("Organization::partof").compiledPlan;
        const organizationNamePlan = snapshot.byLookupKey.get("Organization::name").compiledPlan;
        const relation = buildRelationPlan(
            sourcePlan,
            parseSearchParameterName("partof.partof.name"),
            snapshot
        );
        const value = "Parent Org";
        const expectedFilter = createTypedFilterPlan(organizationNamePlan, value, "name").filter;
        const aggregation = buildRelationAggregation(relation.relationPlan, value);
        const outerLookup = aggregation.chain[0].find((stage) => stage.$lookup?.from === "Organization").$lookup;
        const innerLookup = collectLookups(outerLookup.pipeline).find((lookup) => lookup.from === "Organization");
        expect(innerLookup).to.exist;
        expect(lookupTerminalFilter(innerLookup.pipeline)).to.deep.equal(expectedFilter);
    });

    it("applies per-branch terminal filters for closed fan-out subject.name", function () {
        const snapshot = snapshotFrom([observationSubject, patientName, groupName]);
        const sourcePlan = snapshot.byLookupKey.get("Observation::subject").compiledPlan;
        const patientNamePlan = snapshot.byLookupKey.get("Patient::name").compiledPlan;
        const groupNamePlan = snapshot.byLookupKey.get("Group::name").compiledPlan;
        const relation = buildRelationPlan(
            sourcePlan,
            parseSearchParameterName("subject.name"),
            snapshot
        );
        const value = "Roel";
        const expectedPatientFilter = createTypedFilterPlan(patientNamePlan, value, "name").filter;
        const expectedGroupFilter = createTypedFilterPlan(groupNamePlan, value, "name").filter;
        const aggregation = buildRelationAggregation(relation.relationPlan, value);
        const pipeline = aggregation.chain[0];
        const patientLookup = pipeline.find((stage) => stage.$lookup?.from === "Patient").$lookup;
        const groupLookup = pipeline.find((stage) => stage.$lookup?.from === "Group").$lookup;
        expect(patientLookup).to.exist;
        expect(groupLookup).to.exist;
        const patientFilter = lookupTerminalFilter(patientLookup.pipeline);
        const groupFilter = lookupTerminalFilter(groupLookup.pipeline);
        expect(patientFilter).to.deep.equal(expectedPatientFilter);
        expect(groupFilter).to.deep.equal(expectedGroupFilter);
        expect(patientFilter).to.not.deep.equal(groupFilter);
    });

    it("honors an intermediate type filter when nesting lookups", function () {
        const snapshot = snapshotFrom([
            observationSubject,
            patientOrganization,
            organizationName,
            groupName
        ]);
        const sourcePlan = snapshot.byLookupKey.get("Observation::subject").compiledPlan;
        const relation = buildRelationPlan(
            sourcePlan,
            parseSearchParameterName("subject:Patient.organization.name"),
            snapshot
        );
        const aggregation = buildRelationAggregation(relation.relationPlan, "Acme");
        const lookups = collectLookups(aggregation.chain[0]);
        expect(lookups.some((lookup) => lookup.from === "Patient")).to.equal(true);
        expect(lookups.some((lookup) => lookup.from === "Group")).to.equal(false);
        expect(lookups.some((lookup) => lookup.from === "Organization")).to.equal(true);
    });

    it("skips contained Resource extraction paths when building lookups", function () {
        const mixedSubject = definition(
            {
                code: "subject",
                base: ["Observation"],
                type: "reference",
                expression: "Observation.subject",
                target: ["Patient"]
            },
            ["Observation::subject"]
        );
        const snapshot = snapshotFrom([mixedSubject, patientName]);
        const sourcePlan = snapshot.byLookupKey.get("Observation::subject").compiledPlan;
        sourcePlan.extractionPaths = [
            { path: "contained", datatype: "Resource" },
            { path: "subject", datatype: "Reference" }
        ];
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
        expect(unwindPaths).to.include("$subject");
        expect(aggregation.chain[0].some((stage) => stage.$lookup?.from === "Patient")).to.equal(true);
    });

    it("does not throw internal limit strings for synthetic over-depth or over-cost plans", function () {
        const snapshot = snapshotFrom([observationSubject, patientName]);
        const sourcePlan = snapshot.byLookupKey.get("Observation::subject").compiledPlan;
        const deepRelation = buildRelationPlan(
            sourcePlan,
            parseSearchParameterName("a.b.c.d.e"),
            snapshot
        );
        expect(deepRelation.valid).to.equal(false);

        const overDepthPlan = {
            hops: [
                {
                    code: "a",
                    sourcePlan: {
                        extractionPaths: [{ path: "subject", datatype: "Reference" }]
                    },
                    branches: [
                        {
                            sourceResourceType: "Observation",
                            targetResourceType: "Patient",
                            targetPlan: {
                                extractionPaths: [{ path: "managingOrganization", datatype: "Reference" }]
                            }
                        }
                    ]
                },
                {
                    code: "b",
                    branches: [
                        {
                            sourceResourceType: "Patient",
                            targetResourceType: "Organization",
                            targetPlan: {
                                extractionPaths: [{ path: "partOf", datatype: "Reference" }]
                            }
                        }
                    ]
                },
                {
                    code: "c",
                    branches: [
                        {
                            sourceResourceType: "Organization",
                            targetResourceType: "Organization",
                            targetPlan: {
                                extractionPaths: [{ path: "partOf", datatype: "Reference" }]
                            }
                        }
                    ]
                },
                {
                    code: "d",
                    branches: [
                        {
                            sourceResourceType: "Organization",
                            targetResourceType: "Organization",
                            targetPlan: {
                                code: "name",
                                searchType: "string",
                                extractionPaths: [{ path: "name", datatype: "HumanName" }]
                            }
                        }
                    ]
                }
            ],
            terminal: { code: "name" },
            depth: 4,
            estimatedCost: 30
        };

        let threw = false;
        let aggregation;
        try {
            aggregation = buildRelationAggregation(overDepthPlan, "x");
        } catch (error) {
            threw = true;
            expect(String(error)).to.not.include("Relation depth exceeds allowed limit");
            expect(String(error)).to.not.include("Relation cost exceeds allowed limit");
        }
        expect(threw).to.equal(false);
        expect(collectLookups(aggregation.chain[0]).length).to.be.at.most(3);
        expect(JSON.stringify(aggregation)).to.not.include("Relation depth exceeds allowed limit");
        expect(JSON.stringify(aggregation)).to.not.include("Relation cost exceeds allowed limit");
    });

    it("matches nothing when every extraction path is contained Resource", function () {
        const snapshot = snapshotFrom([observationSubject, patientName]);
        const sourcePlan = snapshot.byLookupKey.get("Observation::subject").compiledPlan;
        const relation = buildRelationPlan(
            sourcePlan,
            parseSearchParameterName("subject:Patient.name"),
            snapshot
        );
        relation.relationPlan.hops[0].sourcePlan = {
            extractionPaths: [{ path: "contained", datatype: "Resource" }]
        };
        const aggregation = buildRelationAggregation(relation.relationPlan, "Roel");
        expect(aggregation.chain[0].some((stage) => stage.$lookup)).to.equal(false);
        expect(aggregation.chain[0].some((stage) => stage.$match?.__chainNoExecutablePath)).to.equal(true);
    });

    it("exports bounded relation constants", function () {
        expect(MAX_RELATION_DEPTH).to.equal(3);
        expect(MAX_RELATION_COST).to.equal(24);
    });
});
