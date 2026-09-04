require("module-alias/register");

const path = require("path");
const { expect } = require("chai");
const { compileDefinition } = require("@models/FHIR/searchParameter/compiler/compiler");
const { applyActivationOverlay } = require("@models/FHIR/searchParameter/registry/activationPolicy");
const { buildRegistrySnapshot } = require("@models/FHIR/searchParameter/registry/snapshot");
const { extractReferenceValues } = require("@models/FHIR/searchParameter/runtime/includeHandler");
const { validateBundleGetSearchParameters } = require("@models/FHIR/searchParameter/runtime/bundleSearchValidation");
const {
    formatRelationLimitDiagnostic
} = require("@models/FHIR/searchParameter/runtime/relationLimitErrors");
const { reloadRegistry } = require("@models/FHIR/searchParameter/registry/registryManager");
const { tryApplyRegistryParameter } = require("@models/FHIR/searchParameter/runtime/registrySearchHandler");
const { createTypedFilterPlan } = require("@models/FHIR/searchParameter/executor/queryValueParser");
const { createFakeRequest, createFakeResponse } = require("../../support/fake-http");
const {
    assertBundleInlineLimitAcrossEntryPoints,
    assertBundleInlineUnknownAcrossEntryPoints,
    buildBundleInlineChainedFanOutResources,
    buildBundleInlineRelationCostResources,
    withBundleRegistry
} = require("../../support/search/bundle-inline-entry-point-assertions");

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
            url: "/Bundle"
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

function operationOutcomeDiagnostics(body) {
    if (body?.issue?.[0]?.diagnostics) {
        return body.issue[0].diagnostics;
    }
    return JSON.stringify(body);
}

describe("Bundle inline special search entry points", function () {
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
        await reloadRegistry({ databaseResources: [] });
    });

    async function searchViaService(resourceType, query) {
        const req = createFakeRequest({ query, originalUrl: `/${resourceType}` });
        const res = createFakeResponse();
        return new SearchService(req, res, resourceType).search();
    }

    it("applies direct and chained Bundle special search through normal search", async function () {
        const directQuery = { composition: "Composition/comp-1" };
        const directResult = await tryApplyRegistryParameter({
            resourceType: "Bundle",
            query: directQuery,
            parameterName: "composition"
        });
        expect(directResult).to.equal("handled");
        expect(directQuery.$and).to.be.an("array").that.is.not.empty;
        expect(JSON.stringify(directQuery.$and)).to.include("entry.0.resource.id");
        expect(JSON.stringify(directQuery.$and)).to.include("document");

        const chainQuery = { "composition.patient": "Patient/123" };
        const chainResult = await tryApplyRegistryParameter({
            resourceType: "Bundle",
            query: chainQuery,
            parameterName: "composition.patient"
        });
        expect(chainResult).to.equal("handled");
        expect(chainQuery.isChain).to.equal(true);
        expect(chainQuery.chain).to.be.an("array").that.is.not.empty;
        expect(chainQuery.chain[0].some((stage) => stage.$match?.$and)).to.equal(true);
        expect(chainQuery.chain[0].some((stage) => stage.$lookup)).to.equal(false);
    });

    it("validates direct Bundle special search values consistently on Bundle GET", async function () {
        await validateBundleGetSearchParameters(
            "Bundle",
            new URLSearchParams("?composition=Composition/comp-1"),
            "Bundle?composition=Composition/comp-1"
        );
        await validateBundleGetSearchParameters(
            "Bundle",
            new URLSearchParams("?composition.patient=Patient/patient-1"),
            "Bundle?composition.patient=Patient/patient-1"
        );
        await validateBundleGetSearchParameters(
            "Bundle",
            new URLSearchParams("?message.focus:Patient.name=Smith"),
            "Bundle?message.focus:Patient.name=Smith"
        );

        let rejected = false;
        try {
            await validateBundleGetSearchParameters(
                "Bundle",
                new URLSearchParams("?composition=MessageHeader/msg-1"),
                "Bundle?composition=MessageHeader/msg-1"
            );
        } catch (error) {
            rejected = true;
            expect(error.message).to.include("Reference value targets MessageHeader, expected Composition");
        }
        expect(rejected).to.equal(true);
    });

    it("maps direct wrong target type consistently across search, Bundle GET, and conditional delete", async function () {
        const parameterName = "composition";
        const query = { [parameterName]: "MessageHeader/msg-1" };
        const expected = "Reference value targets MessageHeader, expected Composition";

        let registryError;
        try {
            await tryApplyRegistryParameter({
                resourceType: "Bundle",
                query: JSON.parse(JSON.stringify(query)),
                parameterName
            });
        } catch (error) {
            registryError = error;
        }
        expect(registryError.message).to.include(expected);

        let bundleError;
        try {
            await validateBundleGetSearchParameters(
                "Bundle",
                new URLSearchParams(`?${parameterName}=MessageHeader/msg-1`),
                `Bundle?${parameterName}=MessageHeader/msg-1`
            );
        } catch (error) {
            bundleError = error;
        }
        expect(bundleError.message).to.include(expected);

        const searchResult = await searchViaService("Bundle", query);
        expect(searchResult.status).to.equal(false);
        expect(searchResult.code).to.equal(400);
        expect(operationOutcomeDiagnostics(searchResult.result)).to.include(expected);

        const { req, res, response } = createConditionDeleteResponse();
        req.query = query;
        await conditionDelete(req, res, "Bundle");
        expect(response.statusCode).to.equal(400);
        expect(operationOutcomeDiagnostics(response.body)).to.include(expected);
        expect(operationOutcomeDiagnostics(response.body)).to.not.equal(
            "Unknown search parameter or value"
        );
    });

    it("maps invalid inline chain values consistently across entry points", async function () {
        const parameterName = "composition.patient";
        const query = { [parameterName]: "Patient/patient-1/extra" };
        const expected = "Unsupported reference value format";

        let registryError;
        try {
            await tryApplyRegistryParameter({
                resourceType: "Bundle",
                query: JSON.parse(JSON.stringify(query)),
                parameterName
            });
        } catch (error) {
            registryError = error;
        }
        expect(registryError.message).to.include(expected);

        let bundleError;
        try {
            await validateBundleGetSearchParameters(
                "Bundle",
                new URLSearchParams(`${parameterName}=Patient%2Fpatient-1%2Fextra`),
                `Bundle?${parameterName}=Patient%2Fpatient-1%2Fextra`
            );
        } catch (error) {
            bundleError = error;
        }
        expect(bundleError.message).to.include(expected);

        const searchResult = await searchViaService("Bundle", query);
        expect(searchResult.status).to.equal(false);
        expect(searchResult.code).to.equal(400);
        expect(operationOutcomeDiagnostics(searchResult.result)).to.include(expected);

        const { req, res, response } = createConditionDeleteResponse();
        req.query = query;
        await conditionDelete(req, res, "Bundle");
        expect(response.statusCode).to.equal(400);
        expect(operationOutcomeDiagnostics(response.body)).to.include(expected);
    });

    it("maps Bundle inline relation-depth consistently across entry points", async function () {
        const parameterName = "composition.patient.organization.partof.name";
        const query = { [parameterName]: "Parent" };
        const expected = formatRelationLimitDiagnostic(parameterName, "relation-depth");

        let registryError;
        try {
            await tryApplyRegistryParameter({
                resourceType: "Bundle",
                query: JSON.parse(JSON.stringify(query)),
                parameterName
            });
        } catch (error) {
            registryError = error;
        }
        expect(registryError.message).to.equal(expected);

        let bundleError;
        try {
            await validateBundleGetSearchParameters(
                "Bundle",
                new URLSearchParams(`?${parameterName}=Parent`),
                `Bundle?${parameterName}=Parent`
            );
        } catch (error) {
            bundleError = error;
        }
        expect(bundleError.message).to.equal(expected);

        const searchResult = await searchViaService("Bundle", query);
        expect(searchResult.status).to.equal(false);
        expect(searchResult.code).to.equal(400);
        expect(operationOutcomeDiagnostics(searchResult.result)).to.equal(expected);

        const { req, res, response } = createConditionDeleteResponse();
        req.query = query;
        await conditionDelete(req, res, "Bundle");
        expect(response.statusCode).to.equal(400);
        expect(operationOutcomeDiagnostics(response.body)).to.equal(expected);
    });

    it("maps Bundle inline relation limits consistently across entry points", async function () {
        const parameterName = "message.focus.name";
        const query = { [parameterName]: "Smith" };

        let registryError;
        try {
            await tryApplyRegistryParameter({
                resourceType: "Bundle",
                query: JSON.parse(JSON.stringify(query)),
                parameterName
            });
        } catch (error) {
            registryError = error;
        }
        expect(registryError.message).to.equal(
            formatRelationLimitDiagnostic(parameterName, "missing-type-filter")
        );

        let bundleError;
        try {
            await validateBundleGetSearchParameters(
                "Bundle",
                new URLSearchParams(`?${parameterName}=Smith`),
                `Bundle?${parameterName}=Smith`
            );
        } catch (error) {
            bundleError = error;
        }
        expect(bundleError.message).to.equal(
            formatRelationLimitDiagnostic(parameterName, "missing-type-filter")
        );

        const searchResult = await searchViaService("Bundle", query);
        expect(searchResult.status).to.equal(false);
        expect(searchResult.code).to.equal(400);
        expect(operationOutcomeDiagnostics(searchResult.result)).to.equal(
            formatRelationLimitDiagnostic(parameterName, "missing-type-filter")
        );

        const { req, res, response } = createConditionDeleteResponse();
        req.query = query;
        await conditionDelete(req, res, "Bundle");
        expect(response.statusCode).to.equal(400);
        expect(operationOutcomeDiagnostics(response.body)).to.equal(
            formatRelationLimitDiagnostic(parameterName, "missing-type-filter")
        );
    });

    it("validates direct Bundle special search on conditional delete", async function () {
        const parameterName = "composition";
        const query = { [parameterName]: "Composition/comp-1" };
        const validatedQuery = await new SearchParameterCreator({
            resourceType: "Bundle",
            query: JSON.parse(JSON.stringify(query))
        }).create();
        expect(validatedQuery.isChain).to.not.equal(true);
        expect(validatedQuery.$and).to.be.an("array").that.is.not.empty;

        const { req, res, response } = createConditionDeleteResponse();
        req.query = query;
        await conditionDelete(req, res, "Bundle");
        expect(response.statusCode).to.equal(200);
    });

    it("keeps _include extraction on Registry reference paths without inline chain aggregation", function () {
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
        const snapshot = snapshotFrom([bundleComposition]);
        const plan = snapshot.byLookupKey.get("Bundle::composition").compiledPlan;
        const doc = {
            resourceType: "Bundle",
            type: "document",
            entry: [
                {
                    fullUrl: "Composition/comp-1",
                    resource: {
                        resourceType: "Composition",
                        id: "comp-1"
                    }
                }
            ]
        };
        expect(extractReferenceValues(doc, plan)).to.deep.equal(["Composition/comp-1"]);
        expect(plan.inlineTarget).to.exist;
        expect(plan.extractionPaths[0].path).to.equal("entry.0.resource");
    });

    it("does not attach inline metadata to generic contained Resource lookups", function () {
        const containedResourceReference = definition(
            {
                code: "subject",
                base: ["Observation"],
                type: "reference",
                expression: "Observation.contained",
                target: ["Resource"]
            },
            ["Observation::subject"]
        );
        const snapshot = snapshotFrom([containedResourceReference]);
        const plan = snapshot.byLookupKey.get("Observation::subject").compiledPlan;
        expect(plan.inlineTarget).to.equal(undefined);
        expect(plan.extractionPaths[0].datatype).to.equal("Resource");
    });

    it("rejects unknown Bundle inline chained hops across entry points", async function () {
        const parameterName = "composition.nocode.name";
        const query = { [parameterName]: "test" };
        await assertBundleInlineUnknownAcrossEntryPoints({
            SearchParameterCreator,
            UnknownSearchParameterError,
            SearchService,
            conditionDelete,
            createConditionDeleteResponse,
            parameterName,
            query
        });
    });

    describe("Bundle inline limit class mapping across entry points (5.5)", function () {
        const limitCases = [
            {
                limitClass: "missing-type-filter",
                parameterName: "message.focus.name",
                query: { "message.focus.name": "Smith" }
            },
            {
                limitClass: "relation-depth",
                parameterName: "composition.patient.organization.partof.name",
                query: { "composition.patient.organization.partof.name": "Parent" }
            }
        ];

        for (const testCase of limitCases) {
            it(`maps ${testCase.limitClass} consistently across search, Bundle GET, and conditional delete`, async function () {
                await assertBundleInlineLimitAcrossEntryPoints({
                    SearchService,
                    conditionDelete,
                    createConditionDeleteResponse,
                    parameterName: testCase.parameterName,
                    query: testCase.query,
                    limitClass: testCase.limitClass
                });
            });
        }

        it("maps relation-cost consistently across search, Bundle GET, and conditional delete", async function () {
            /** @type {import('@models/FHIR/searchParameter/registry/types').SearchParameterResource[]} */
            const resources = [];
            buildBundleInlineRelationCostResources(resources);
            const parameterName = "composition.patient-multi.name";
            const query = { [parameterName]: "test" };

            await withBundleRegistry(resources, async () => {
                await assertBundleInlineLimitAcrossEntryPoints({
                    SearchService,
                    conditionDelete,
                    createConditionDeleteResponse,
                    parameterName,
                    query,
                    limitClass: "relation-cost"
                });
            });
        });
    });

    describe("Bundle inline chained search semantics (5.6)", function () {
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

        it("accepts multiple inline chained patient name values at the registry handler", async function () {
            /** @type {import('@models/FHIR/searchParameter/registry/types').SearchParameterResource[]} */
            const resources = [];
            buildBundleInlineChainedFanOutResources(resources);
            const parameterName = "composition.patient.name";

            await withBundleRegistry(resources, async () => {
                const query = { [parameterName]: "Roel,InlineGroupRoel" };
                const result = await tryApplyRegistryParameter({
                    resourceType: "Bundle",
                    query,
                    parameterName
                });
                expect(result).to.equal("handled");
                expect(query.isChain).to.equal(true);
                const lookups = collectLookups(query.chain[0]);
                expect(lookups.some((lookup) => lookup.from === "Patient")).to.equal(true);
                expect(lookups.some((lookup) => lookup.from === "Group")).to.equal(true);
                const patientLookup = query.chain[0].find((stage) => stage.$lookup?.from === "Patient")
                    .$lookup;
                const terminalFilter = lookupTerminalFilter(patientLookup.pipeline);
                expect(JSON.stringify(terminalFilter)).to.include("$or");
            });
        });

        it("applies terminal :exact modifier for inline composition.patient.name", async function () {
            /** @type {import('@models/FHIR/searchParameter/registry/types').SearchParameterResource[]} */
            const resources = [];
            buildBundleInlineChainedFanOutResources(resources);
            const parameterName = "composition.patient.name:exact";

            await withBundleRegistry(resources, async () => {
                const query = { [parameterName]: "Bor" };
                const result = await tryApplyRegistryParameter({
                    resourceType: "Bundle",
                    query,
                    parameterName
                });
                expect(result).to.equal("handled");
                const patientLookup = query.chain[0].find((stage) => stage.$lookup?.from === "Patient")
                    .$lookup;
                const groupLookup = query.chain[0].find((stage) => stage.$lookup?.from === "Group")
                    .$lookup;
                const snapshot = snapshotFrom([
                    definition(
                        {
                            code: "name",
                            base: ["Patient"],
                            type: "string",
                            expression: "Patient.name"
                        },
                        ["Patient::name"]
                    ),
                    definition(
                        {
                            code: "name",
                            base: ["Group"],
                            type: "string",
                            expression: "Group.name"
                        },
                        ["Group::name"]
                    )
                ]);
                const patientNamePlan = snapshot.byLookupKey.get("Patient::name").compiledPlan;
                const expectedPatientFilter = createTypedFilterPlan(
                    patientNamePlan,
                    "Bor",
                    "name:exact"
                ).filter;
                expect(lookupTerminalFilter(patientLookup.pipeline)).to.deep.equal(
                    expectedPatientFilter
                );
                expect(lookupTerminalFilter(groupLookup.pipeline)).to.not.deep.equal(
                    lookupTerminalFilter(patientLookup.pipeline)
                );
            });
        });

        it("nests external Organization lookup for composition.patient:Patient.organization.name", async function () {
            const parameterName = "composition.patient:Patient.organization.name";
            const query = { [parameterName]: "Acme" };
            const result = await tryApplyRegistryParameter({
                resourceType: "Bundle",
                query,
                parameterName
            });
            expect(result).to.equal("handled");
            const pipeline = query.chain[0];
            const lookups = collectLookups(pipeline);
            expect(lookups.some((lookup) => lookup.from === "Composition")).to.equal(false);
            expect(lookups.some((lookup) => lookup.from === "Group")).to.equal(false);
            const patientLookup = pipeline.find((stage) => stage.$lookup?.from === "Patient").$lookup;
            const orgLookup = collectLookups(patientLookup.pipeline).find(
                (lookup) => lookup.from === "Organization"
            );
            expect(orgLookup).to.exist;
        });

        it("applies per-branch typed filters for composition.patient.name fan-out", async function () {
            /** @type {import('@models/FHIR/searchParameter/registry/types').SearchParameterResource[]} */
            const resources = [];
            buildBundleInlineChainedFanOutResources(resources);
            const parameterName = "composition.patient.name";

            await withBundleRegistry(resources, async () => {
                const query = { [parameterName]: "Roel" };
                const result = await tryApplyRegistryParameter({
                    resourceType: "Bundle",
                    query,
                    parameterName
                });
                expect(result).to.equal("handled");
                const snapshot = snapshotFrom([
                    definition(
                        {
                            code: "name",
                            base: ["Patient"],
                            type: "string",
                            expression: "Patient.name"
                        },
                        ["Patient::name"]
                    ),
                    definition(
                        {
                            code: "name",
                            base: ["Group"],
                            type: "string",
                            expression: "Group.name"
                        },
                        ["Group::name"]
                    )
                ]);
                const patientNamePlan = snapshot.byLookupKey.get("Patient::name").compiledPlan;
                const groupNamePlan = snapshot.byLookupKey.get("Group::name").compiledPlan;
                const expectedPatientFilter = createTypedFilterPlan(
                    patientNamePlan,
                    "Roel",
                    "name"
                ).filter;
                const expectedGroupFilter = createTypedFilterPlan(groupNamePlan, "Roel", "name").filter;
                const patientLookup = query.chain[0].find((stage) => stage.$lookup?.from === "Patient")
                    .$lookup;
                const groupLookup = query.chain[0].find((stage) => stage.$lookup?.from === "Group")
                    .$lookup;
                expect(lookupTerminalFilter(patientLookup.pipeline)).to.deep.equal(
                    expectedPatientFilter
                );
                expect(lookupTerminalFilter(groupLookup.pipeline)).to.deep.equal(expectedGroupFilter);
                expect(lookupTerminalFilter(patientLookup.pipeline)).to.not.deep.equal(
                    lookupTerminalFilter(groupLookup.pipeline)
                );
            });
        });

        it("keeps existing Observation one-hop chained search working at the registry handler", async function () {
            const parameterName = "subject:Patient.name";
            const query = { [parameterName]: "Roel" };
            const result = await tryApplyRegistryParameter({
                resourceType: "Observation",
                query,
                parameterName
            });
            expect(result).to.equal("handled");
            expect(query.isChain).to.equal(true);
            expect(query.chain[0].some((stage) => stage.$lookup?.from === "Patient")).to.equal(true);
            expect(query.chain[0].some((stage) => stage.$lookup?.from === "Observation")).to.equal(
                false
            );
        });

        it("rejects valid chained Bundle special conditional delete after validation", async function () {
            const parameterName = "composition.patient:Patient.organization.name";
            const query = { [parameterName]: "Acme" };
            const validatedQuery = await new SearchParameterCreator({
                resourceType: "Bundle",
                query: JSON.parse(JSON.stringify(query))
            }).create();
            expect(validatedQuery.isChain).to.equal(true);

            const { req, res, response } = createConditionDeleteResponse();
            req.query = query;
            await conditionDelete(req, res, "Bundle");
            expect(response.statusCode).to.equal(400);
            expect(operationOutcomeDiagnostics(response.body)).to.include(
                "Chained search is not supported for conditional delete"
            );
            expect(operationOutcomeDiagnostics(response.body)).to.not.include("relation-depth");
            expect(operationOutcomeDiagnostics(response.body)).to.not.include("relation-cost");
        });
    });
});
