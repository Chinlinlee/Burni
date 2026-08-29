const _ = require("lodash");
const mongoose = require("mongoose");
const fetch = require("node-fetch");
const { handleError, ErrorOperationOutcome } = require("@models/FHIR/httpMessage");
const { ensureRegistryLoaded } = require("../registry/registryManager");
const {
    getReferenceLookup,
    listReferenceLookups,
    isDeclaredTarget,
    isReferenceLookup
} = require("../registry/referenceMetadata");
const { executeSearchQueryPlan } = require("../executor/mongoExecutor");
const { isResourceType } = require("@root/utils/fhir-url");

/**
 * @param {string} str
 * @returns {boolean}
 */
function isValidHttpUrl(str) {
    try {
        const url = new URL(str);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

/**
 * @param {*} value
 * @param {import('../compiler/searchQueryPlan').ExtractionPath} extractionPath
 * @returns {string[]}
 */
function collectReferenceStrings(value, extractionPath) {
    if (value == null || value === false) {
        return [];
    }
    if (Array.isArray(value)) {
        return value.flatMap((entry) => collectReferenceStrings(entry, extractionPath));
    }
    if (typeof value === "string") {
        return [value];
    }
    if (typeof value === "object") {
        if (extractionPath.datatype === "Resource" && value.resourceType && value.id) {
            return [`${value.resourceType}/${value.id}`];
        }
        if (value.reference) {
            return [value.reference];
        }
        if (value.resourceType && value.id) {
            return [`${value.resourceType}/${value.id}`];
        }
    }
    return [];
}

/**
 * @param {Object} doc
 * @param {import('../compiler/searchQueryPlan').ExtractionPath} extractionPath
 * @returns {string[]}
 */
function extractFromPath(doc, extractionPath) {
    const correlation = extractionPath.correlation;
    if (correlation?.kind === "same-array-element" && correlation.parentPath) {
        const parent = _.get(doc, correlation.parentPath);
        const elements = Array.isArray(parent) ? parent : parent ? [parent] : [];
        const leafField = extractionPath.path.slice(correlation.parentPath.length + 1);
        const values = [];
        for (const element of elements) {
            if (!element || typeof element !== "object") {
                continue;
            }
            const predicates = extractionPath.predicates || [];
            const typeEquals = predicates.find((entry) => entry.kind === "typeEquals");
            const systemEquals = predicates.find((entry) => entry.kind === "systemEquals");
            if (typeEquals?.value && element.type !== typeEquals.value) {
                continue;
            }
            if (systemEquals?.value && element.system !== systemEquals.value) {
                continue;
            }
            if (extractionPath.referenceTargetType && element.type && element.type !== extractionPath.referenceTargetType) {
                continue;
            }
            const leaf = leafField ? _.get(element, leafField) : element;
            values.push(...collectReferenceStrings(leaf, extractionPath));
        }
        return values;
    }

    const raw = _.get(doc, extractionPath.path);
    return collectReferenceStrings(raw, extractionPath);
}

/**
 * @param {Object} doc
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @param {string | undefined} specificType
 * @returns {string[]}
 */
function extractReferenceValues(doc, plan, specificType) {
    const values = [];
    for (const extractionPath of plan.extractionPaths) {
        values.push(...extractFromPath(doc, extractionPath));
    }
    const unique = [...new Set(values.filter(Boolean))];
    if (!specificType) {
        return unique;
    }
    return unique.filter((value) => value.includes(specificType));
}

/**
 * @param {string} resourceName
 * @param {string} paramName
 * @param {string} queryString
 */
function checkResourceIsExistInMongoDB(resourceName, paramName, queryString) {
    try {
        mongoose.model(resourceName);
    } catch {
        throw new ErrorOperationOutcome(
            400,
            handleError.processing(
                `Invalid ${paramName} parameter: \`${queryString}\`. Invalid/unsupported resource type: \`${resourceName}\``
            )
        );
    }
}

/**
 * @param {import('../registry/types').RegistrySnapshot} snapshot
 * @param {string} resourceName
 * @param {string} searchParam
 * @param {string} paramName
 * @param {string} queryString
 */
function checkIsReferenceTypeSearchParameter(snapshot, resourceName, searchParam, paramName, queryString) {
    if (!isReferenceLookup(snapshot, resourceName, searchParam)) {
        const resourceReferenceParams = listReferenceLookups(snapshot, resourceName);
        throw new ErrorOperationOutcome(
            400,
            handleError.processing(
                `Invalid ${paramName} parameter: \`${queryString}\`. Invalid search parameter: \`${searchParam}\`. The search parameter type must be a reference type. Valid search parameters are: \`${JSON.stringify(
                    resourceReferenceParams
                )}\``
            )
        );
    }
}

/**
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan | null} plan
 * @param {string} resourceName
 * @param {string} searchParam
 * @param {string} paramName
 * @param {string} queryString
 */
function checkSearchParameterName(plan, resourceName, searchParam, paramName, queryString) {
    if (searchParam === "*") {
        return;
    }
    if (!plan) {
        throw new ErrorOperationOutcome(
            400,
            handleError.processing(
                `Invalid ${paramName} parameter \`${queryString}\`. Unknown search parameter \`${searchParam}\` for resource ${resourceName}`
            )
        );
    }
}

/**
 * @param {string} url
 * @param {string} specificType
 * @param {Array} mongoSearchResult
 */
async function getIncludeValueByFetch(url, specificType, mongoSearchResult) {
    const specificTypeCondition = specificType && url.includes(specificType);
    if (!specificType || specificTypeCondition) {
        const refResourceResponse = await fetch(url, {
            headers: {
                accept: "application/fhir+json"
            }
        });
        if (refResourceResponse.status == 200) {
            mongoSearchResult.push(await refResourceResponse.json());
        }
    }
}

/**
 * @param {string} referenceValue
 * @param {string} specificType
 * @param {Array} mongoSearchResult
 */
async function getIncludeValueInDB(referenceValue, specificType, mongoSearchResult) {
    const specificTypeCondition = specificType && referenceValue.includes(specificType);
    const referenceValueSplit = referenceValue.split("/");
    const resourceInValue = referenceValueSplit[0];
    const id = referenceValueSplit[1];
    if (!specificType || specificTypeCondition) {
        if (referenceValueSplit.length === 2 && isResourceType(resourceInValue)) {
            const doc = await mongoose.model(resourceInValue).findOne({ id }).exec();
            if (doc) {
                const fhirDoc = doc.getFHIRField();
                _.set(fhirDoc, "myPointToCheckIsInclude", true);
                mongoSearchResult.push(fhirDoc);
            }
        } else if (referenceValue.includes("_history") && referenceValueSplit.length === 4) {
            const versionId = referenceValueSplit[3];
            const doc = await mongoose
                .model(resourceInValue)
                .findOne({
                    $and: [{ id }, { "meta.versionId": versionId }]
                })
                .exec();
            if (doc) {
                const fhirDoc = doc.getFHIRField();
                _.set(fhirDoc, "myPointToCheckIsInclude", true);
                mongoSearchResult.push(fhirDoc);
            }
        }
    }
}

/**
 * @param {Object} doc
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @param {string | undefined} specificType
 * @param {Array} mongoSearchResult
 */
async function pushIncludeDocWithPlan(doc, plan, specificType, mongoSearchResult) {
    if (specificType && !isDeclaredTarget(plan, specificType)) {
        throw new ErrorOperationOutcome(
            400,
            handleError.processing(
                `Invalid _include parameter. Undeclared reference target: \`${specificType}\``
            )
        );
    }
    const referenceValues = extractReferenceValues(doc, plan, specificType);
    for (const referenceValue of referenceValues) {
        if (isValidHttpUrl(referenceValue)) {
            await getIncludeValueByFetch(referenceValue, specificType, mongoSearchResult);
        } else {
            await getIncludeValueInDB(referenceValue, specificType, mongoSearchResult);
        }
    }
}

/**
 * @param {string} includeQuery
 * @param {Object} doc
 * @param {Array} mongoSearchResult
 * @param {import('../registry/types').RegistrySnapshot} snapshot
 */
async function pushIncludeDoc(includeQuery, doc, mongoSearchResult, snapshot) {
    const [resourceName, searchParam, specificType] = includeQuery.split(":");
    checkResourceIsExistInMongoDB(resourceName, "_include", includeQuery);
    checkIsReferenceTypeSearchParameter(snapshot, resourceName, searchParam, "_include", includeQuery);

    if (searchParam !== "*") {
        const lookup = getReferenceLookup(snapshot, resourceName, searchParam);
        checkSearchParameterName(lookup?.plan || null, resourceName, searchParam, "_include", includeQuery);
        await pushIncludeDocWithPlan(doc, lookup.plan, specificType, mongoSearchResult);
        return;
    }

    for (const param of listReferenceLookups(snapshot, resourceName)) {
        const lookup = getReferenceLookup(snapshot, resourceName, param);
        if (!lookup) {
            continue;
        }
        await pushIncludeDocWithPlan(doc, lookup.plan, specificType, mongoSearchResult);
    }
}

/**
 * @param {Object} query
 * @param {Array} mongoSearchResult
 */
async function handleIncludeParam(query, mongoSearchResult) {
    let include = _.get(query, "_include", false);
    const includeDocs = [];
    if (!include) {
        return includeDocs;
    }
    const snapshot = await ensureRegistryLoaded();
    if (!_.isArray(include)) {
        include = [include];
    }
    for (const includeQuery of include) {
        for (const doc of mongoSearchResult) {
            await pushIncludeDoc(includeQuery, doc, includeDocs, snapshot);
        }
    }
    return includeDocs;
}

/**
 * @param {string} revIncludeQuery
 * @param {Object} doc
 * @param {Array} mongoSearchResult
 * @param {string} resourceType
 * @param {import('../registry/types').RegistrySnapshot} snapshot
 */
async function pushRevIncludeDoc(revIncludeQuery, doc, mongoSearchResult, resourceType, snapshot) {
    if (doc.resourceType != resourceType) {
        return;
    }
    const referenceValue = `${resourceType}/${doc.id}`;
    const [resourceName, searchParam, specificType] = revIncludeQuery.split(":");
    checkResourceIsExistInMongoDB(resourceName, "_revinclude", revIncludeQuery);
    checkIsReferenceTypeSearchParameter(
        snapshot,
        resourceName,
        searchParam,
        "_revinclude",
        revIncludeQuery
    );

    const codes = searchParam === "*" ? listReferenceLookups(snapshot, resourceName) : [searchParam];
    if (searchParam !== "*") {
        const lookup = getReferenceLookup(snapshot, resourceName, searchParam);
        checkSearchParameterName(lookup?.plan || null, resourceName, searchParam, "_include", revIncludeQuery);
    }

    for (const code of codes) {
        const lookup = getReferenceLookup(snapshot, resourceName, code);
        if (!lookup) {
            continue;
        }
        if (specificType && !isDeclaredTarget(lookup.plan, specificType) && specificType !== resourceType) {
            throw new ErrorOperationOutcome(
                400,
                handleError.processing(
                    `Invalid _revinclude parameter. Undeclared relationship: \`${revIncludeQuery}\``
                )
            );
        }
        const filter = executeSearchQueryPlan(lookup.plan, referenceValue, code);
        const found = await mongoose.model(resourceName).find(filter).exec();
        for (const matched of found) {
            const fhirDoc = matched.getFHIRField();
            _.set(fhirDoc, "myPointToCheckIsInclude", true);
            mongoSearchResult.push(fhirDoc);
        }
    }
}

/**
 * @param {Object} query
 * @param {Array} mongoSearchResult
 * @param {string} resourceType
 */
async function handleRevIncludeParam(query, mongoSearchResult, resourceType) {
    let revinclude = _.get(query, "_revinclude", false);
    const revincludeDocs = [];
    if (!revinclude) {
        return revincludeDocs;
    }
    const snapshot = await ensureRegistryLoaded();
    if (!_.isArray(revinclude)) {
        revinclude = [revinclude];
    }
    for (const revincludeQuery of revinclude) {
        for (const doc of mongoSearchResult) {
            await pushRevIncludeDoc(revincludeQuery, doc, revincludeDocs, resourceType, snapshot);
        }
    }
    return revincludeDocs;
}

module.exports = {
    extractReferenceValues,
    handleIncludeParam,
    handleRevIncludeParam,
    isValidHttpUrl
};
