require("module-alias/register");

const fs = require("fs");
const os = require("os");
const path = require("path");
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
const { reloadRegistry, resetRegistryCache } = require("@models/FHIR/searchParameter/registry/registryManager");
const { getEffectiveDefinition } = require("@models/FHIR/searchParameter/registry/snapshot");
const { tryApplyRegistryParameter } = require("@models/FHIR/searchParameter/runtime/registrySearchHandler");
const { createFakeRequest, createFakeResponse } = require("../../support/fake-http");
const {
    RelationLimitSearchParameterError,
    formatRelationLimitDiagnostic
} = require("@models/FHIR/searchParameter/runtime/relationLimitErrors");

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

/**
 * @param {import('@models/FHIR/searchParameter/registry/types').SearchParameterResource[]} resources
 * @returns {string}
 */
function writeSearchParameterBundle(resources) {
    const bundle = {
        resourceType: "Bundle",
        type: "collection",
        entry: resources.map((resource) => ({ resource }))
    };
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "burni-sp-limit-"));
    const bundlePath = path.join(tempDir, "search-parameters.json");
    fs.writeFileSync(bundlePath, JSON.stringify(bundle));
    return bundlePath;
}

/**
 * @param {import('@models/FHIR/searchParameter/registry/types').SearchParameterResource[]} resources
 * @param {() => Promise<void>} action
 */
async function withBundleRegistry(resources, action) {
    resetRegistryCache();
    const bundlePath = writeSearchParameterBundle(resources);
    await reloadRegistry({ bundlePath, databaseResources: [] });
    try {
        await action();
    } finally {
        resetRegistryCache();
        await reloadRegistry({ databaseResources: [] });
    }
}

function createConditionDeleteResponse() {
    /** @type {{ statusCode: number | null, body: unknown }} */
    const response = {
        statusCode: null,
        body: null
    };
    return {
        response,
        req: {
            query: {},
            url: "/Observation"
        },
        res: {
            getHeader() {
                return "application/fhir+json";
            },
            status(code) {
                response.statusCode = code;
                return this;
            },
            send(body) {
                response.body = body;
                return this;
            },
            header() {
                return this;
            }
        }
    };
}

function expectLimitDiagnostic(error, parameterName, limitClass) {
    expect(error).to.be.instanceOf(RelationLimitSearchParameterError);
    expect(error.limitClass).to.equal(limitClass);
    expect(error.parameterName).to.equal(parameterName);
    expect(error.message).to.equal(formatRelationLimitDiagnostic(parameterName, limitClass));
    expect(error.message).to.include(limitClass);
    expect(error.message).to.include(parameterName);
    expect(error.message).to.not.include("Relation cost exceeds allowed limit");
    expect(error.message).to.not.include("Recursive chain is not supported");
    expect(error.message).to.not.include("Relation cycle is not allowed");
}

function operationOutcomeDiagnostics(body) {
    if (body?.issue?.[0]?.diagnostics) {
        return body.issue[0].diagnostics;
    }
    return JSON.stringify(body);
}

function expectOperationOutcomeLimitDiagnostic(body, parameterName, limitClass) {
    expect(body).to.have.property("resourceType", "OperationOutcome");
    expect(body.issue).to.be.an("array").that.is.not.empty;
    const diagnostics = operationOutcomeDiagnostics(body);
    expect(diagnostics).to.equal(formatRelationLimitDiagnostic(parameterName, limitClass));
    expect(diagnostics).to.include(limitClass);
    expect(diagnostics).to.include(parameterName);
    expect(diagnostics).to.not.include("Relation cost exceeds allowed limit");
    expect(diagnostics).to.not.include("Recursive chain is not supported");
    expect(diagnostics).to.not.include("Relation cycle is not allowed");
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

describe("Relation limit diagnostics across entry points", function () {
    this.timeout(300000);

    /** @type {typeof import('@root/api/FHIRApiService/search/searchParameterCreator').SearchParameterCreator} */
    let SearchParameterCreator;
    /** @type {typeof import('@root/api/FHIRApiService/search/searchParameterCreator').UnknownSearchParameterError} */
    let UnknownSearchParameterError;
    /** @type {import('@root/api/FHIRApiService/condition-delete')} */
    let conditionDelete;
    /** @type {typeof import('@root/api/FHIRApiService/services/search.service').SearchService} */
    let SearchService;

    before(async function () {
        const moduleAlias = require("module-alias");
        moduleAlias.addAlias("models/mongodb", path.join(__dirname, "../../../models/mongodb"));
        const { startMongoMemory } = require("../../support/mongo-memory");
        await startMongoMemory();
        const creatorModule = require("@root/api/FHIRApiService/search/searchParameterCreator");
        SearchParameterCreator = creatorModule.SearchParameterCreator;
        UnknownSearchParameterError = creatorModule.UnknownSearchParameterError;
        conditionDelete = require("@root/api/FHIRApiService/condition-delete");
        SearchService = require("@root/api/FHIRApiService/services/search.service").SearchService;
    });

    async function searchViaService(resourceType, query) {
        const req = createFakeRequest({ query, originalUrl: `/${resourceType}` });
        const res = createFakeResponse();
        return new SearchService(req, res, resourceType).search();
    }

    const openCompositionSubject = {
        resourceType: "SearchParameter",
        url: "http://example.org/SearchParameter/Composition-subject",
        version: "4.0.1",
        status: "active",
        code: "subject",
        base: ["Composition"],
        type: "reference",
        expression: "Composition.subject",
        target: []
    };
    const observationSubject = {
        resourceType: "SearchParameter",
        url: "http://example.org/SearchParameter/Observation-subject",
        version: "4.0.1",
        status: "active",
        code: "subject",
        base: ["Observation"],
        type: "reference",
        expression: "Observation.subject",
        target: ["Patient", "Group"]
    };
    const multiTargetObservationSubject = {
        resourceType: "SearchParameter",
        url: "http://example.org/SearchParameter/Observation-subject-multi",
        version: "4.0.1",
        status: "active",
        code: "subject",
        base: ["Observation"],
        type: "reference",
        expression: "Observation.subject",
        target: [
            "Patient",
            "Group",
            "Practitioner",
            "Organization",
            "Location",
            "Person",
            "CareTeam"
        ]
    };
    const patientName = {
        resourceType: "SearchParameter",
        url: "http://example.org/SearchParameter/Patient-name",
        version: "4.0.1",
        status: "active",
        code: "name",
        base: ["Patient"],
        type: "string",
        expression: "Patient.name"
    };
    const groupName = {
        resourceType: "SearchParameter",
        url: "http://example.org/SearchParameter/Group-name",
        version: "4.0.1",
        status: "active",
        code: "name",
        base: ["Group"],
        type: "string",
        expression: "Group.name"
    };
    const targetNameParameters = [
        "Patient",
        "Group",
        "Practitioner",
        "Organization",
        "Location",
        "Person",
        "CareTeam"
    ].map((targetType) => ({
        resourceType: "SearchParameter",
        url: `http://example.org/SearchParameter/${targetType}-name`,
        version: "4.0.1",
        status: "active",
        code: "name",
        base: [targetType],
        type: "string",
        expression: `${targetType}.name`
    }));

    const limitCases = [
        {
            limitClass: "missing-type-filter",
            resourceType: "Composition",
            parameterName: "subject.name",
            resources: [openCompositionSubject, patientName]
        },
        {
            limitClass: "relation-depth",
            resourceType: "Observation",
            parameterName: "subject.a.b.c.d",
            resources: [observationSubject, patientName, groupName]
        },
        {
            limitClass: "relation-cost",
            resourceType: "Observation",
            parameterName: "subject.name",
            resources: [multiTargetObservationSubject, ...targetNameParameters]
        }
    ];

    for (const testCase of limitCases) {
        it(`maps ${testCase.limitClass} consistently across search, Bundle GET, and conditional delete`, async function () {
            await withBundleRegistry(testCase.resources, async () => {
                let registryError;
                try {
                    await tryApplyRegistryParameter({
                        resourceType: testCase.resourceType,
                        query: { [testCase.parameterName]: "test" },
                        parameterName: testCase.parameterName
                    });
                } catch (error) {
                    registryError = error;
                }
                expectLimitDiagnostic(registryError, testCase.parameterName, testCase.limitClass);

                let creatorError;
                try {
                    await new SearchParameterCreator({
                        resourceType: testCase.resourceType,
                        query: { [testCase.parameterName]: "test" }
                    }).create();
                } catch (error) {
                    creatorError = error;
                }
                expectLimitDiagnostic(creatorError, testCase.parameterName, testCase.limitClass);

                let bundleError;
                try {
                    await validateBundleGetSearchParameters(
                        testCase.resourceType,
                        new URLSearchParams(`?${testCase.parameterName}=test`),
                        `${testCase.resourceType}?${testCase.parameterName}=test`
                    );
                } catch (error) {
                    bundleError = error;
                }
                expect(bundleError).to.exist;
                expect(bundleError.code).to.equal(400);
                expect(bundleError.message).to.equal(
                    formatRelationLimitDiagnostic(testCase.parameterName, testCase.limitClass)
                );
                expectOperationOutcomeLimitDiagnostic(
                    bundleError.operationOutcome,
                    testCase.parameterName,
                    testCase.limitClass
                );

                const searchResult = await searchViaService(testCase.resourceType, {
                    [testCase.parameterName]: "test"
                });
                expect(searchResult.status).to.equal(false);
                expect(searchResult.code).to.equal(400);
                expectOperationOutcomeLimitDiagnostic(
                    searchResult.result,
                    testCase.parameterName,
                    testCase.limitClass
                );

                const { req, res, response } = createConditionDeleteResponse();
                req.query = { [testCase.parameterName]: "test" };
                await conditionDelete(req, res, testCase.resourceType);
                expect(response.statusCode).to.equal(400);
                expectOperationOutcomeLimitDiagnostic(
                    response.body,
                    testCase.parameterName,
                    testCase.limitClass
                );
            });
        });
    }

    it("keeps unknown chained hops as Unknown search parameter across entry points", async function () {
        await withBundleRegistry([observationSubject, patientName, groupName], async () => {
            const parameterName = "subject.nocode.name";
            const result = await tryApplyRegistryParameter({
                resourceType: "Observation",
                query: { [parameterName]: "test" },
                parameterName
            });
            expect(result).to.equal("disabled");

            let creatorError;
            try {
                await new SearchParameterCreator({
                    resourceType: "Observation",
                    query: { [parameterName]: "test" }
                }).create();
            } catch (error) {
                creatorError = error;
            }
            expect(creatorError).to.be.instanceOf(UnknownSearchParameterError);
            expect(creatorError.message).to.include(parameterName);

            let bundleError;
            try {
                await validateBundleGetSearchParameters(
                    "Observation",
                    new URLSearchParams(`?${parameterName}=test`),
                    `Observation?${parameterName}=test`
                );
            } catch (error) {
                bundleError = error;
            }
            expect(bundleError.message).to.include("Unknown parameter");
            expect(bundleError.message).to.not.include("missing-type-filter");
            expect(bundleError.message).to.not.include("relation-depth");
            expect(bundleError.message).to.not.include("relation-cost");

            const searchResult = await searchViaService("Observation", { [parameterName]: "test" });
            expect(searchResult.status).to.equal(false);
            expect(searchResult.code).to.equal(400);
            expect(operationOutcomeDiagnostics(searchResult.result)).to.include(parameterName);

            const { req, res, response } = createConditionDeleteResponse();
            req.query = { [parameterName]: "test" };
            await conditionDelete(req, res, "Observation");
            expect(response.statusCode).to.equal(400);
            expect(operationOutcomeDiagnostics(response.body)).to.include(parameterName);
            expect(operationOutcomeDiagnostics(response.body)).to.not.include("missing-type-filter");
            expect(operationOutcomeDiagnostics(response.body)).to.not.include("relation-depth");
            expect(operationOutcomeDiagnostics(response.body)).to.not.include("relation-cost");
        });
    });

    it("rejects valid chained conditional delete after SearchParameterCreator validation", async function () {
        await withBundleRegistry([observationSubject, patientName], async () => {
            const parameterName = "subject:Patient.name";
            const query = { [parameterName]: "Roel" };
            const validatedQuery = await new SearchParameterCreator({
                resourceType: "Observation",
                query: JSON.parse(JSON.stringify(query))
            }).create();
            expect(validatedQuery.isChain).to.equal(true);

            const { req, res, response } = createConditionDeleteResponse();
            req.query = query;
            await conditionDelete(req, res, "Observation");
            expect(response.statusCode).to.equal(400);
            expect(operationOutcomeDiagnostics(response.body)).to.include(
                "Chained search is not supported for conditional delete"
            );
        });
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
