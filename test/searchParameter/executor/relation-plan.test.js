require("module-alias/register");

const { expect } = require("chai");
const { compileDefinition } = require("@models/FHIR/searchParameter/compiler/compiler");
const { applyActivationOverlay } = require("@models/FHIR/searchParameter/registry/activationPolicy");
const { buildRegistrySnapshot } = require("@models/FHIR/searchParameter/registry/snapshot");
const {
    MAX_RELATION_DEPTH,
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

describe("one-level reference chain", function () {
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

    it("builds a one-level relation plan from declared targets and target lookup", function () {
        const snapshot = snapshotFrom([observationSubject, patientName, groupName]);
        const sourcePlan = snapshot.byLookupKey.get("Observation::subject").compiledPlan;
        const result = buildRelationPlan(sourcePlan, "name", snapshot);
        expect(result.valid).to.equal(true);
        expect(result.relationPlan.depth).to.equal(MAX_RELATION_DEPTH);
        expect(result.relationPlan.targetResourceTypes).to.deep.equal(["Patient", "Group"]);
        expect(result.relationPlan.targetPlan.code).to.equal("name");
        expect(result.relationPlan.estimatedCost).to.be.at.most(MAX_RELATION_COST);
    });

    it("honors a type filter against declared targets", function () {
        const snapshot = snapshotFrom([observationSubject, patientName, groupName]);
        const sourcePlan = snapshot.byLookupKey.get("Observation::subject").compiledPlan;
        const result = buildRelationPlan(sourcePlan, "name", snapshot, "Patient");
        expect(result.valid).to.equal(true);
        expect(result.relationPlan.targetResourceTypes).to.deep.equal(["Patient"]);
    });

    it("rejects recursive chain, undeclared target, unknown lookup, and cycle", function () {
        const snapshot = snapshotFrom([observationSubject, patientName]);
        const sourcePlan = snapshot.byLookupKey.get("Observation::subject").compiledPlan;

        expect(buildRelationPlan(sourcePlan, "name.family", snapshot).valid).to.equal(false);
        expect(buildRelationPlan(sourcePlan, "name", snapshot, "Practitioner").reason).to.include(
            "Undeclared reference target"
        );
        expect(buildRelationPlan(sourcePlan, "not-a-param", snapshot).valid).to.equal(false);

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
        const loopSnapshot = snapshotFrom([looping]);
        const loopPlan = loopSnapshot.byLookupKey.get("Observation::subject").compiledPlan;
        expect(buildRelationPlan(loopPlan, "subject", loopSnapshot).reason).to.include("cycle");
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
        expect(buildRelationPlan(sourcePlan, "name", snapshot).reason).to.include(
            "Undeclared chain parameter"
        );
    });

    it("builds a bounded $lookup aggregation from extraction paths", function () {
        const snapshot = snapshotFrom([observationSubject, patientName]);
        const sourcePlan = snapshot.byLookupKey.get("Observation::subject").compiledPlan;
        const relation = buildRelationPlan(sourcePlan, "name", snapshot, "Patient");
        const aggregation = buildRelationAggregation(relation.relationPlan, "Roel");
        expect(aggregation.isChain).to.equal(true);
        expect(aggregation.chain[0].some((stage) => stage.$lookup?.from === "Patient")).to.equal(true);
        expect(JSON.stringify(aggregation.chain[0])).to.include("$unwind");
        expect(JSON.stringify(aggregation.chain[0])).to.include("$match");
    });
});
