require("module-alias/register");

const path = require("path");
const mongoose = require("mongoose");
const { expect } = require("chai");
const {
    clearCollections,
    insertResources,
    searchBundleViaService,
    searchResourceViaService,
    getStoredBundleIds
} = require("../../support/fhir/bundle-inline-search");
const { createPatientViaService } = require("../../support/fhir/patient-service");
const {
    CHAINED_HIT_SETS,
    DIRECT_HIT_SETS,
    buildDocumentBundleCompanion,
    buildDocumentBundleMain,
    buildDocumentEntryOneCompositionTrap,
    buildDocumentGroupSubject,
    buildDocumentNestedOrganization,
    buildDocumentWrongFirstEntry,
    buildMessageBundleCompanion,
    buildMessageBundleMain,
    loadRelatedResourceTemplates,
    replacePlaceholders
} = require("../../fixtures/bundle-inline/builders");
const { validateBundleGetSearchParameters } = require("@models/FHIR/searchParameter/runtime/bundleSearchValidation");
const {
    formatRelationLimitDiagnostic
} = require("@models/FHIR/searchParameter/runtime/relationLimitErrors");
const {
    assertBundleInlineLimitAcrossEntryPoints,
    assertBundleInlineUnknownAcrossEntryPoints,
    buildBundleInlineRelationCostResources,
    operationOutcomeDiagnostics,
    withBundleRegistry
} = require("../../support/search/bundle-inline-entry-point-assertions");

/**
 * @param {Record<string, string>} idsByRole
 * @param {string[]} returnedIds
 * @param {string[]} expectedRoles
 * @param {string[]} excludedRoles
 */
function expectHitRoles(idsByRole, returnedIds, expectedRoles, excludedRoles = []) {
    const returnedRoles = returnedIds
        .map((id) => idsByRole.get(id))
        .filter(Boolean)
        .sort();
    expect(returnedRoles).to.deep.equal([...expectedRoles].sort());
    for (const role of excludedRoles) {
        const excludedId = [...idsByRole.entries()].find(([, value]) => value === role)?.[0];
        if (excludedId) {
            expect(returnedIds, `role ${role} should not match`).to.not.include(excludedId);
        }
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

describe("Bundle inline special search integration", function () {
    this.timeout(300000);

    /** @type {typeof import('@root/api/FHIRApiService/search/searchParameterCreator').SearchParameterCreator} */
    let SearchParameterCreator;
    /** @type {typeof import('@root/api/FHIRApiService/search/searchParameterCreator').UnknownSearchParameterError} */
    let UnknownSearchParameterError;
    /** @type {import('@root/api/FHIRApiService/condition-delete')} */
    let conditionDelete;
    /** @type {typeof import('@root/api/FHIRApiService/services/search.service').SearchService} */
    let SearchService;

    /** @type {Map<string, string>} */
    let idsByRole;
    /** @type {{ patientMainId: string, patientFocusId: string, patientNestedOrgId: string, observationId: string, groupMainId: string, organizationId: string }} */
    let fixtureIds;

    before(async function () {
        const moduleAlias = require("module-alias");
        moduleAlias.addAlias("models/mongodb", path.join(__dirname, "../../../models/mongodb"));
        const { startMongoMemory } = require("../../support/mongo-memory");
        process.env.ENABLE_VALIDATOR = "false";
        await startMongoMemory();
        const creatorModule = require("@root/api/FHIRApiService/search/searchParameterCreator");
        SearchParameterCreator = creatorModule.SearchParameterCreator;
        UnknownSearchParameterError = creatorModule.UnknownSearchParameterError;
        conditionDelete = require("@root/api/FHIRApiService/condition-delete");
        SearchService = require("@root/api/FHIRApiService/services/search.service").SearchService;
        const { reloadRegistry } = require("@models/FHIR/searchParameter/registry/registryManager");
        await reloadRegistry({ databaseResources: [] });
    });

    after(async function () {
        const {
            dropMongoTestDatabase,
            stopMongoMemory
        } = require("../../support/mongo-memory");
        await dropMongoTestDatabase();
        await stopMongoMemory();
        delete process.env.ENABLE_VALIDATOR;
    });

    beforeEach(async function () {
        await clearCollections(["Bundle", "Patient", "Observation", "Group", "Organization"]);

        const templates = loadRelatedResourceTemplates();
        const [patientMain, , patientFocus] = await Promise.all(
            templates.patients.map((patient) => createPatientViaService(patient))
        );
        const [groupMain] = await insertResources("Group", templates.groups);
        const [organization] = await insertResources("Organization", templates.organizations);
        const [patientNestedOrg] = await insertResources("Patient", [
            {
                ...templates.patients[0],
                name: [{ family: "NestedOrg", given: ["AcmePatient"] }]
            }
        ]);
        await mongoose.model("Patient").updateOne(
            { id: patientNestedOrg.id },
            { $set: { managingOrganization: { reference: `Organization/${organization.id}` } } }
        );
        const observationTemplate = replacePlaceholders(templates.observations[0], {
            "placeholder-patient-main": patientMain.id
        });
        const [observation] = await insertResources("Observation", [observationTemplate]);

        fixtureIds = {
            patientMainId: patientMain.id,
            patientFocusId: patientFocus.id,
            patientNestedOrgId: patientNestedOrg.id,
            observationId: observation.id,
            groupMainId: groupMain.id,
            organizationId: organization.id
        };

        const bundles = [
            buildDocumentBundleMain(fixtureIds),
            buildDocumentBundleCompanion(fixtureIds),
            buildDocumentEntryOneCompositionTrap(fixtureIds),
            buildDocumentWrongFirstEntry(fixtureIds),
            buildDocumentGroupSubject(fixtureIds),
            buildDocumentNestedOrganization(fixtureIds),
            buildMessageBundleMain(fixtureIds),
            buildMessageBundleCompanion(fixtureIds)
        ];

        const storedBundles = await insertResources("Bundle", bundles);
        idsByRole = new Map(
            storedBundles.map((bundle, index) => [bundle.id, bundles[index]._fixtureRole])
        );
    });

    describe("document/message fixtures and direct hit-sets", function () {
        for (const [caseName, hitSet] of Object.entries(DIRECT_HIT_SETS)) {
            it(`matches ${caseName} positive hit-set via normal search`, async function () {
                const query = {
                    [hitSet.parameter]: hitSet.valueFrom(fixtureIds)
                };
                const searchResult = await searchBundleViaService(query);
                expect(searchResult.status).to.equal(true);
                expect(searchResult.code).to.equal(200);
                const returnedIds = getStoredBundleIds(searchResult.result);
                expectHitRoles(
                    idsByRole,
                    returnedIds,
                    hitSet.expectRoles,
                    hitSet.excludeRoles
                );
            });
        }

        it("accepts multiple direct composition identity values", async function () {
            const searchResult = await searchBundleViaService({
                composition: "comp-main,https://example.org/fhir/Composition/comp-main"
            });
            expect(searchResult.status).to.equal(true);
            const returnedIds = getStoredBundleIds(searchResult.result);
            expectHitRoles(idsByRole, returnedIds, ["document-main"], [
                "document-companion",
                "document-entry1-trap"
            ]);
        });
    });

    describe("direct identity rejection and gating", function () {
        const invalidDirectValues = [
            {
                label: "wrong target type",
                query: { composition: "MessageHeader/msg-main" },
                expected: "Reference value targets MessageHeader, expected Composition"
            },
            {
                label: "versioned reference",
                query: { composition: "Composition/comp-main|2" },
                expected: "Versioned references are not supported"
            },
            {
                label: "contained reference",
                query: { composition: "#contained-1" },
                expected: "Contained references are not supported"
            },
            {
                label: "logical identifier",
                query: { composition: "urn:oid:example|12345" },
                expected: "Versioned references are not supported"
            }
        ];

        for (const testCase of invalidDirectValues) {
            it(`rejects direct ${testCase.label} consistently`, async function () {
                const searchResult = await searchBundleViaService(testCase.query);
                expect(searchResult.status).to.equal(false);
                expect(searchResult.code).to.equal(400);
                expect(operationOutcomeDiagnostics(searchResult.result)).to.include(
                    testCase.expected
                );

                const parameterName = Object.keys(testCase.query)[0];
                let bundleError;
                try {
                    await validateBundleGetSearchParameters(
                        "Bundle",
                        new URLSearchParams(
                            `?${parameterName}=${encodeURIComponent(testCase.query[parameterName])}`
                        ),
                        `Bundle?${parameterName}=${testCase.query[parameterName]}`
                    );
                } catch (error) {
                    bundleError = error;
                }
                expect(bundleError.message).to.include(testCase.expected);
            });
        }

        it("does not match invalid stored bundles or entry[1] traps", async function () {
            const searchResult = await searchBundleViaService({
                composition: "Composition/comp-main"
            });
            const returnedIds = getStoredBundleIds(searchResult.result);
            expectHitRoles(idsByRole, returnedIds, ["document-main"], [
                "document-companion",
                "document-entry1-trap",
                "document-wrong-first-entry"
            ]);
        });
    });

    describe("inline chained search hit-sets", function () {
        describe("positive mongo hit-sets", function () {
            const GROUP_NAME_SEARCH_PARAMETER_ID = "bundle-inline-test-group-name";

            before(async function () {
                await mongoose.connection.collection("SearchParameter").insertOne({
                    resourceType: "SearchParameter",
                    id: GROUP_NAME_SEARCH_PARAMETER_ID,
                    url: "http://example.org/SearchParameter/Group-name",
                    version: "4.0.1",
                    status: "active",
                    code: "name",
                    base: ["Group"],
                    type: "string",
                    expression: "Group.name"
                });
                const {
                    reloadRegistry,
                    resetRegistryCache
                } = require("@models/FHIR/searchParameter/registry/registryManager");
                resetRegistryCache();
                await reloadRegistry();
            });

            after(async function () {
                await mongoose.connection.collection("SearchParameter").deleteMany({
                    id: GROUP_NAME_SEARCH_PARAMETER_ID
                });
                const {
                    reloadRegistry,
                    resetRegistryCache
                } = require("@models/FHIR/searchParameter/registry/registryManager");
                resetRegistryCache();
                await reloadRegistry();
            });
            for (const [caseName, hitSet] of Object.entries(CHAINED_HIT_SETS)) {
                it(`matches ${caseName} positive hit-set via normal search`, async function () {
                    const searchResult = await searchBundleViaService({
                        [hitSet.parameter]: hitSet.value
                    });
                    expect(searchResult.status).to.equal(true);
                    expect(searchResult.code).to.equal(200);
                    const returnedIds = getStoredBundleIds(searchResult.result);
                    expectHitRoles(
                        idsByRole,
                        returnedIds,
                        hitSet.expectRoles,
                        hitSet.excludeRoles
                    );
                });
            }

            it("accepts multiple inline chained patient name values", async function () {
                const searchResult = await searchBundleViaService({
                    "composition.patient.name": "Roel,InlineGroupRoel"
                });
                expect(searchResult.status).to.equal(true);
                const returnedIds = getStoredBundleIds(searchResult.result);
                expectHitRoles(idsByRole, returnedIds, ["document-main", "document-group-subject"], [
                    "document-companion",
                    "document-entry1-trap",
                    "document-nested-org",
                    "message-main"
                ]);
            });
        });

        it("rejects message.focus.name without a type filter", async function () {
            const parameterName = "message.focus.name";
            const searchResult = await searchBundleViaService({
                [parameterName]: "Mila"
            });
            expect(searchResult.status).to.equal(false);
            expect(searchResult.code).to.equal(400);
            expect(operationOutcomeDiagnostics(searchResult.result)).to.equal(
                formatRelationLimitDiagnostic(parameterName, "missing-type-filter")
            );
        });
    });

    describe("relation limits and unknown parameters (5.5)", function () {
        const limitCases = [
            {
                limitClass: "missing-type-filter",
                parameterName: "message.focus.name",
                query: { "message.focus.name": "Mila" }
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

        it("maps unknown inline chained hops consistently across entry points", async function () {
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
    });

    describe("inline chained search semantics (5.6)", function () {
        it("validates multiple inline chained patient name values through SearchParameterCreator", async function () {
            const validatedQuery = await new SearchParameterCreator({
                resourceType: "Bundle",
                query: { "composition.patient.name": "Roel,InlineGroupRoel" }
            }).create();
            expect(validatedQuery.isChain).to.equal(true);
            expect(validatedQuery.chain).to.be.an("array").that.is.not.empty;
        });

        it("validates nested external hop and terminal modifier through SearchParameterCreator", async function () {
            const nestedQuery = await new SearchParameterCreator({
                resourceType: "Bundle",
                query: { "composition.patient:Patient.organization.name": "Acme" }
            }).create();
            expect(nestedQuery.isChain).to.equal(true);

            const exactQuery = await new SearchParameterCreator({
                resourceType: "Bundle",
                query: { "composition.patient.name:exact": "Bor" }
            }).create();
            expect(exactQuery.isChain).to.equal(true);
        });

        it("rejects valid nested chained Bundle conditional delete after validation", async function () {
            const query = { "composition.patient:Patient.organization.name": "Acme" };
            await new SearchParameterCreator({
                resourceType: "Bundle",
                query: JSON.parse(JSON.stringify(query))
            }).create();

            const { req, res, response } = createConditionDeleteResponse();
            req.query = query;
            await conditionDelete(req, res, "Bundle");
            expect(response.statusCode).to.equal(400);
            expect(operationOutcomeDiagnostics(response.body)).to.include(
                "Chained search is not supported for conditional delete"
            );
        });
    });

    describe("existing one-hop chained search compatibility", function () {
        it("keeps Observation subject:Patient.name one-hop search working", async function () {
            const searchResult = await searchResourceViaService("Observation", {
                "subject:Patient.name": "Roel"
            });
            expect(searchResult.status).to.equal(true);
            expect(searchResult.code).to.equal(200);
            const observationIds = (searchResult.result.entry || [])
                .map((entry) => entry.resource?.id)
                .filter(Boolean);
            expect(observationIds).to.include(fixtureIds.observationId);
        });
    });
});
