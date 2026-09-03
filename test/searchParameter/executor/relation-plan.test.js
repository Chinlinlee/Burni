require("module-alias/register");

const { expect } = require("chai");
const fhirResourceCatalog = require("@models/FHIR/fhir.resourceList.json");
const { compileDefinition } = require("@models/FHIR/searchParameter/compiler/compiler");
const { applyActivationOverlay } = require("@models/FHIR/searchParameter/registry/activationPolicy");
const { buildRegistrySnapshot } = require("@models/FHIR/searchParameter/registry/snapshot");
const { parseSearchParameterName } = require("@models/FHIR/searchParameter/runtime/parameterName");
const {
    MAX_RELATION_DEPTH,
    MAX_RELATION_COST,
    buildRelationPlan,
    buildRelationAggregation,
    isOpenReferenceTarget
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

    it("rejects non-reference chaining, unknown lookup, and undeclared closed type filter", function () {
        const snapshot = snapshotFrom([observationSubject, patientName]);
        const sourcePlan = snapshot.byLookupKey.get("Observation::subject").compiledPlan;

        const nonReference = buildRelationPlan(
            sourcePlan,
            parseSearchParameterName("subject.name.family"),
            snapshot
        );
        expect(nonReference.valid).to.equal(false);
        expect(nonReference.class).to.equal("unknown");

        const undeclaredWithFilter = buildRelationPlan(
            sourcePlan,
            parseSearchParameterName("subject:Practitioner.name"),
            snapshot
        );
        expect(undeclaredWithFilter.valid).to.equal(false);
        expect(undeclaredWithFilter.class).to.equal("unknown");

        const unknownHop = buildRelationPlan(
            sourcePlan,
            parseSearchParameterName("subject.not-a-param"),
            snapshot
        );
        expect(unknownHop.valid).to.equal(false);
        expect(unknownHop.class).to.equal("unknown");
    });

    it("allows repeated lookup keys such as partof.partof", function () {
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
        expect(result.class).to.equal("unknown");
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

    it("looks up only the filtered type for an open hop with a type filter", function () {
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
        expect(result.class).to.equal("unknown");
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
        expect(result.class).to.equal("relation-depth");
        expect(result.relationPlan).to.equal(undefined);
    });

    it("rejects relation cost above the module limit without leaking internal strings", function () {
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
        expect(result.class).to.equal("relation-cost");
        expect(JSON.stringify(result)).to.not.include("Relation cost exceeds allowed limit");
        expect(JSON.stringify(result)).to.not.include("Recursive chain is not supported");
        expect(JSON.stringify(result)).to.not.include("Relation cycle is not allowed");
    });

    it("allows an empty chain allowlist to continue effective next hops", function () {
        const snapshot = snapshotFrom([observationSubject, patientName, groupName]);
        const sourcePlan = snapshot.byLookupKey.get("Observation::subject").compiledPlan;
        const result = buildRelationPlan(
            sourcePlan,
            parseSearchParameterName("subject.name"),
            snapshot
        );
        expect(result.valid).to.equal(true);
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
        expect(result.class).to.equal("unknown");
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

    it("exports bounded relation constants", function () {
        expect(MAX_RELATION_DEPTH).to.equal(3);
        expect(MAX_RELATION_COST).to.equal(24);
    });
});
