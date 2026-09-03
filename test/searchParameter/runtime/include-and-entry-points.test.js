require("module-alias/register");

const fs = require("fs");
const { expect } = require("chai");
const { compileDefinition } = require("@models/FHIR/searchParameter/compiler/compiler");
const { applyActivationOverlay } = require("@models/FHIR/searchParameter/registry/activationPolicy");
const { buildRegistrySnapshot } = require("@models/FHIR/searchParameter/registry/snapshot");
const {
    getReferenceLookup,
    listReferenceLookups,
    isDeclaredTarget,
    isReferenceLookup
} = require("@models/FHIR/searchParameter/registry/referenceMetadata");
const { extractReferenceValues } = require("@models/FHIR/searchParameter/runtime/includeHandler");
const { validateBundleGetSearchParameters } = require("@models/FHIR/searchParameter/runtime/bundleSearchValidation");
const { isControlParameter, parseSearchParameterName } = require("@models/FHIR/searchParameter/runtime/parameterName");
const {
    getResourceTypeInUrl,
    getIdInFullUrl,
    isResourceType
} = require("@root/utils/fhir-url");
const { reloadRegistry } = require("@models/FHIR/searchParameter/registry/registryManager");
const { getEffectiveDefinition } = require("@models/FHIR/searchParameter/registry/snapshot");
const { tryApplyRegistryParameter } = require("@models/FHIR/searchParameter/runtime/registrySearchHandler");

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

function definition(resource, lookupKeys) {
    return {
        resource: {
            resourceType: "SearchParameter",
            url: `http://example.org/SearchParameter/${lookupKeys[0]}`,
            version: "4.0.1",
            status: "active",
            ...resource
        },
        source: "builtin-bundle",
        canonicalKey: `http://example.org/SearchParameter/${lookupKeys[0]}::4.0.1`,
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
    return buildRegistrySnapshot({
        definitions: defs.map(compileActive),
        diagnostics: [],
        version: 1
    });
}

describe("Registry-driven include and control metadata", function () {
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
    const observationCode = definition(
        {
            code: "code",
            base: ["Observation"],
            type: "token",
            expression: "Observation.code"
        },
        ["Observation::code"]
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

    it("lists declared reference lookups and rejects undeclared include targets", function () {
        const snapshot = snapshotFrom([observationSubject, observationCode, patientName]);
        expect(listReferenceLookups(snapshot, "Observation")).to.deep.equal(["subject"]);
        expect(isReferenceLookup(snapshot, "Observation", "subject")).to.equal(true);
        expect(isReferenceLookup(snapshot, "Observation", "code")).to.equal(false);
        const lookup = getReferenceLookup(snapshot, "Observation", "subject");
        expect(isDeclaredTarget(lookup.plan, "Patient")).to.equal(true);
        expect(isDeclaredTarget(lookup.plan, "Practitioner")).to.equal(false);
    });

    it("extracts include reference values from Registry extraction paths", function () {
        const snapshot = snapshotFrom([observationSubject]);
        const plan = getReferenceLookup(snapshot, "Observation", "subject").plan;
        const doc = {
            resourceType: "Observation",
            subject: { reference: "Patient/example" }
        };
        expect(extractReferenceValues(doc, plan)).to.deep.equal(["Patient/example"]);
        expect(extractReferenceValues(doc, plan, "Group")).to.deep.equal([]);
        expect(extractReferenceValues(doc, plan, "Patient")).to.deep.equal(["Patient/example"]);
    });

    it("uses the same Registry lookup for search, include, chain, and Bundle GET parsing", function () {
        const snapshot = snapshotFrom([observationSubject, observationCode, patientName]);
        const parsed = parseSearchParameterName("subject:Patient.name");
        expect(parsed.code).to.equal("subject");
        const searchDefinition = snapshot.byLookupKey.get("Observation::subject");
        const includeLookup = getReferenceLookup(snapshot, "Observation", parsed.code);
        expect(includeLookup.plan).to.equal(searchDefinition.compiledPlan);
        expect(includeLookup.plan.searchType).to.equal("reference");

        const { buildRelationPlan } = require("@models/FHIR/searchParameter/executor/relationPlan");
        const relation = buildRelationPlan(searchDefinition.compiledPlan, parsed, snapshot);
        expect(relation.valid).to.equal(true);
        expect(relation.relationPlan.hops[0].typeFilter).to.equal("Patient");
        expect(relation.relationPlan.hops[0].branches[0].targetResourceType).to.equal("Patient");
        expect(relation.relationPlan.hops[0].branches[0].targetPlan.code).to.equal("name");
    });

    it("treats _include and _count as control parameters, not SearchParameter lookups", function () {
        expect(isControlParameter("_include")).to.equal(true);
        expect(isControlParameter("_count")).to.equal(true);
        expect(isControlParameter("subject")).to.equal(false);
    });

    it("validates Bundle GET search parameters from Registry lookup", async function () {
        await require("@models/FHIR/searchParameter/registry/registryManager").reloadRegistry({
            databaseResources: []
        });

        await validateBundleGetSearchParameters(
            "Observation",
            new URLSearchParams("?code=vital-signs&_count=10"),
            "Observation?code=vital-signs"
        );

        let rejected = false;
        try {
            await validateBundleGetSearchParameters(
                "Observation",
                new URLSearchParams("?not-a-param=1"),
                "Observation?not-a-param=1"
            );
        } catch (error) {
            rejected = true;
            expect(error.message).to.include("Unknown parameter");
        }
        expect(rejected).to.equal(true);
    });
});

describe("Registry chained search handler", function () {
    it("does not pre-build a single-branch typed filter before aggregation", function () {
        const handlerPath = require.resolve(
            "@models/FHIR/searchParameter/runtime/registrySearchHandler"
        );
        const source = fs.readFileSync(handlerPath, "utf8");
        expect(source).to.not.include("lastHop.branches[0]");
        expect(source).to.not.include("createTypedFilterPlan");
    });

    it("pushes one pipeline per chained parameter from composed relation paths", async function () {
        const oneHopQuery = { "subject:Patient.name": "Roel" };
        const oneHopResult = await tryApplyRegistryParameter({
            resourceType: "Observation",
            query: oneHopQuery,
            parameterName: "subject:Patient.name"
        });
        expect(oneHopResult).to.equal("handled");
        expect(oneHopQuery.chain).to.be.an("array");
        expect(oneHopQuery.chain).to.have.length(1);
        expect(oneHopQuery.chain[0].some((stage) => stage.$lookup?.from === "Patient")).to.equal(
            true
        );
        expect(oneHopQuery["subject:Patient.name"]).to.equal(undefined);

        const twoHopQuery = { "subject:Patient.organization.name": "Acme" };
        const twoHopResult = await tryApplyRegistryParameter({
            resourceType: "Observation",
            query: twoHopQuery,
            parameterName: "subject:Patient.organization.name"
        });
        expect(twoHopResult).to.equal("handled");
        expect(twoHopQuery.chain).to.have.length(1);
        const patientLookup = twoHopQuery.chain[0].find((stage) => stage.$lookup?.from === "Patient")
            .$lookup;
        expect(collectLookups(patientLookup.pipeline).some((lookup) => lookup.from === "Organization"))
            .to.equal(true);
    });
});

describe("Bundle URL helpers are independent of SearchParameter lookup", function () {
    it("parses resource type and id from relative and absolute URLs", function () {
        expect(getResourceTypeInUrl("Patient/123")).to.equal("Patient");
        expect(getIdInFullUrl("Patient/123")).to.equal("123");
        expect(isResourceType("Patient")).to.equal(true);
        expect(isResourceType("NotAResource")).to.equal(false);
    });

    it("resolves SearchParameter type lookup from Registry", async function () {
        const snapshot = await reloadRegistry();
        const definition = getEffectiveDefinition(snapshot, "Patient", "name");
        expect(definition.compiledPlan.searchType).to.equal("string");
    });
});
