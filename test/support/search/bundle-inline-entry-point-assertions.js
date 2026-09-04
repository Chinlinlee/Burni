const fs = require("fs");
const os = require("os");
const path = require("path");
const { expect } = require("chai");
const { validateBundleGetSearchParameters } = require("@models/FHIR/searchParameter/runtime/bundleSearchValidation");
const {
    RelationLimitSearchParameterError,
    formatRelationLimitDiagnostic
} = require("@models/FHIR/searchParameter/runtime/relationLimitErrors");
const { resetRegistryCache, reloadRegistry } = require("@models/FHIR/searchParameter/registry/registryManager");
const { tryApplyRegistryParameter } = require("@models/FHIR/searchParameter/runtime/registrySearchHandler");
const { createFakeRequest, createFakeResponse } = require("../fake-http");

const INTERNAL_LIMIT_REASON_FRAGMENTS = [
    "Relation cost exceeds allowed limit",
    "Relation depth exceeds allowed limit",
    "Recursive chain is not supported",
    "Relation cycle is not allowed"
];

/**
 * @param {Object} body
 * @returns {string}
 */
function operationOutcomeDiagnostics(body) {
    if (body?.issue?.[0]?.diagnostics) {
        return body.issue[0].diagnostics;
    }
    return JSON.stringify(body);
}

/**
 * @param {unknown} error
 * @param {string} parameterName
 * @param {string} limitClass
 */
function expectLimitDiagnostic(error, parameterName, limitClass) {
    expect(error).to.be.instanceOf(RelationLimitSearchParameterError);
    expect(error.limitClass).to.equal(limitClass);
    expect(error.parameterName).to.equal(parameterName);
    expect(error.message).to.equal(formatRelationLimitDiagnostic(parameterName, limitClass));
    for (const fragment of INTERNAL_LIMIT_REASON_FRAGMENTS) {
        expect(error.message).to.not.include(fragment);
    }
}

/**
 * @param {Object} body
 * @param {string} parameterName
 * @param {string} limitClass
 */
function expectOperationOutcomeLimitDiagnostic(body, parameterName, limitClass) {
    expect(body).to.have.property("resourceType", "OperationOutcome");
    expect(body.issue).to.be.an("array").that.is.not.empty;
    const diagnostics = operationOutcomeDiagnostics(body);
    expect(diagnostics).to.equal(formatRelationLimitDiagnostic(parameterName, limitClass));
    expect(diagnostics).to.include(limitClass);
    expect(diagnostics).to.include(parameterName);
    for (const fragment of INTERNAL_LIMIT_REASON_FRAGMENTS) {
        expect(diagnostics).to.not.include(fragment);
    }
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
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "burni-bundle-inline-sp-"));
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

/**
 * @param {import('@models/FHIR/searchParameter/registry/types').SearchParameterResource[]} relationCostResources
 */
function buildBundleInlineRelationCostResources(relationCostResources) {
    const targetTypes = [
        "Patient",
        "Group",
        "Practitioner",
        "Organization",
        "Location",
        "Person",
        "CareTeam"
    ];
    const bundleComposition = {
        resourceType: "SearchParameter",
        url: "http://example.org/SearchParameter/Bundle-composition",
        version: "4.0.1",
        status: "active",
        code: "composition",
        base: ["Bundle"],
        type: "reference",
        expression: "Bundle.entry[0].resource",
        target: ["Composition"]
    };
    const compositionPatientMulti = {
        resourceType: "SearchParameter",
        url: "http://example.org/SearchParameter/Composition-patient-multi",
        version: "4.0.1",
        status: "active",
        code: "patient-multi",
        base: ["Composition"],
        type: "reference",
        expression: "Composition.subject",
        target: targetTypes
    };
    const targetNameParameters = targetTypes.map((targetType) => ({
        resourceType: "SearchParameter",
        url: `http://example.org/SearchParameter/${targetType}-name`,
        version: "4.0.1",
        status: "active",
        code: "name",
        base: [targetType],
        type: "string",
        expression: `${targetType}.name`
    }));
    relationCostResources.push(
        bundleComposition,
        compositionPatientMulti,
        ...targetNameParameters
    );
}

/**
 * @param {import('@models/FHIR/searchParameter/registry/types').SearchParameterResource[]} resources
 */
function buildBundleInlineChainedFanOutResources(resources) {
    resources.push(
        {
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
        {
            resourceType: "SearchParameter",
            url: "http://example.org/SearchParameter/Composition-patient",
            version: "4.0.1",
            status: "active",
            code: "patient",
            base: ["Composition"],
            type: "reference",
            expression: "Composition.subject",
            target: ["Patient", "Group"]
        },
        {
            resourceType: "SearchParameter",
            url: "http://example.org/SearchParameter/Patient-name",
            version: "4.0.1",
            status: "active",
            code: "name",
            base: ["Patient"],
            type: "string",
            expression: "Patient.name"
        },
        {
            resourceType: "SearchParameter",
            url: "http://example.org/SearchParameter/Group-name",
            version: "4.0.1",
            status: "active",
            code: "name",
            base: ["Group"],
            type: "string",
            expression: "Group.name"
        }
    );
}

/**
 * @param {Object} options
 * @param {typeof import('@root/api/FHIRApiService/services/search.service').SearchService} options.SearchService
 * @param {import('@root/api/FHIRApiService/condition-delete')} options.conditionDelete
 * @param {() => { req: Object, res: Object, response: { statusCode: number | null, body: unknown } }} options.createConditionDeleteResponse
 * @param {string} options.parameterName
 * @param {Record<string, string>} options.query
 * @param {string} options.limitClass
 */
async function assertBundleInlineLimitAcrossEntryPoints(options) {
    const {
        SearchService,
        conditionDelete,
        createConditionDeleteResponse,
        parameterName,
        query,
        limitClass
    } = options;

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
    expectLimitDiagnostic(registryError, parameterName, limitClass);

    let bundleError;
    try {
        await validateBundleGetSearchParameters(
            "Bundle",
            new URLSearchParams(`?${parameterName}=${encodeURIComponent(query[parameterName])}`),
            `Bundle?${parameterName}=${query[parameterName]}`
        );
    } catch (error) {
        bundleError = error;
    }
    expect(bundleError).to.exist;
    expect(bundleError.message).to.equal(
        formatRelationLimitDiagnostic(parameterName, limitClass)
    );
    if (bundleError.operationOutcome) {
        expectOperationOutcomeLimitDiagnostic(
            bundleError.operationOutcome,
            parameterName,
            limitClass
        );
    }

    const req = createFakeRequest({ query, originalUrl: "/Bundle" });
    const res = createFakeResponse();
    const searchResult = await new SearchService(req, res, "Bundle").search();
    expect(searchResult.status).to.equal(false);
    expect(searchResult.code).to.equal(400);
    expectOperationOutcomeLimitDiagnostic(searchResult.result, parameterName, limitClass);

    const { req: deleteReq, res: deleteRes, response } = createConditionDeleteResponse();
    deleteReq.query = query;
    await conditionDelete(deleteReq, deleteRes, "Bundle");
    expect(response.statusCode).to.equal(400);
    expectOperationOutcomeLimitDiagnostic(response.body, parameterName, limitClass);
}

/**
 * @param {Object} options
 * @param {typeof import('@root/api/FHIRApiService/search/searchParameterCreator').SearchParameterCreator} options.SearchParameterCreator
 * @param {typeof import('@root/api/FHIRApiService/search/searchParameterCreator').UnknownSearchParameterError} options.UnknownSearchParameterError
 * @param {typeof import('@root/api/FHIRApiService/services/search.service').SearchService} options.SearchService
 * @param {import('@root/api/FHIRApiService/condition-delete')} options.conditionDelete
 * @param {() => { req: Object, res: Object, response: { statusCode: number | null, body: unknown } }} options.createConditionDeleteResponse
 * @param {string} options.parameterName
 * @param {Record<string, string>} options.query
 */
async function assertBundleInlineUnknownAcrossEntryPoints(options) {
    const {
        SearchParameterCreator,
        UnknownSearchParameterError,
        SearchService,
        conditionDelete,
        createConditionDeleteResponse,
        parameterName,
        query
    } = options;
    const limitClasses = ["missing-type-filter", "relation-depth", "relation-cost"];

    const registryResult = await tryApplyRegistryParameter({
        resourceType: "Bundle",
        query: JSON.parse(JSON.stringify(query)),
        parameterName
    });
    expect(registryResult).to.equal("disabled");

    let creatorError;
    try {
        await new SearchParameterCreator({
            resourceType: "Bundle",
            query: JSON.parse(JSON.stringify(query))
        }).create();
    } catch (error) {
        creatorError = error;
    }
    expect(creatorError).to.be.instanceOf(UnknownSearchParameterError);
    expect(creatorError.message).to.include(parameterName);
    for (const limitClass of limitClasses) {
        expect(creatorError.message).to.not.include(limitClass);
    }

    let bundleError;
    try {
        await validateBundleGetSearchParameters(
            "Bundle",
            new URLSearchParams(`?${parameterName}=${encodeURIComponent(query[parameterName])}`),
            `Bundle?${parameterName}=${query[parameterName]}`
        );
    } catch (error) {
        bundleError = error;
    }
    expect(bundleError.message).to.include("Unknown parameter");
    expect(bundleError.message).to.include(parameterName);
    for (const limitClass of limitClasses) {
        expect(bundleError.message).to.not.include(limitClass);
    }

    const req = createFakeRequest({ query, originalUrl: "/Bundle" });
    const res = createFakeResponse();
    const searchResult = await new SearchService(req, res, "Bundle").search();
    expect(searchResult.status).to.equal(false);
    expect(searchResult.code).to.equal(400);
    const diagnostics = operationOutcomeDiagnostics(searchResult.result);
    expect(diagnostics).to.include(parameterName);
    for (const limitClass of limitClasses) {
        expect(diagnostics).to.not.include(limitClass);
    }

    const { req: deleteReq, res: deleteRes, response } = createConditionDeleteResponse();
    deleteReq.query = query;
    await conditionDelete(deleteReq, deleteRes, "Bundle");
    expect(response.statusCode).to.equal(400);
    const deleteDiagnostics = operationOutcomeDiagnostics(response.body);
    expect(deleteDiagnostics).to.include(parameterName);
    for (const limitClass of limitClasses) {
        expect(deleteDiagnostics).to.not.include(limitClass);
    }
}

module.exports = {
    INTERNAL_LIMIT_REASON_FRAGMENTS,
    assertBundleInlineLimitAcrossEntryPoints,
    assertBundleInlineUnknownAcrossEntryPoints,
    buildBundleInlineChainedFanOutResources,
    buildBundleInlineRelationCostResources,
    expectLimitDiagnostic,
    expectOperationOutcomeLimitDiagnostic,
    operationOutcomeDiagnostics,
    withBundleRegistry
};
