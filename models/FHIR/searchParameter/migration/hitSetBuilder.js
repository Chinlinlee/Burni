const { executeSearchQueryPlan } = require("../executor/mongoExecutor");
const { extractSearchValue } = require("./fixtureValueExtractor");
const { hashHitSet } = require("./hitSets");
const { KNOWN_HIT_SETS } = require("./hitSets");
const { augmentDocumentForHitSet } = require("./syntheticHitSetValues");

/**
 * @typedef {'main' | 'companion' | 'none'} ExpectDocument
 */

/**
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @param {Record<string, string>} query
 * @param {Object} mainDocument
 * @param {Object} companionDocument
 * @returns {ExpectDocument}
 */
function resolveExpectDocument(plan, query, mainDocument, companionDocument) {
    const parameterName = Object.keys(query)[0];
    const rawValue = query[parameterName];
    let filter;
    try {
        filter = executeSearchQueryPlan(plan, rawValue, parameterName);
    } catch {
        return "none";
    }
    const mainMatches = documentMatchesFilter(mainDocument, filter);
    const companionMatches = documentMatchesFilter(companionDocument, filter);

    if (mainMatches && !companionMatches) {
        return "main";
    }
    if (companionMatches && !mainMatches) {
        return "companion";
    }
    if (mainMatches && companionMatches) {
        return "main";
    }
    return "none";
}

/**
 * @param {Object} document
 * @param {Object} filter
 * @returns {boolean}
 */
function documentMatchesFilter(document, filter) {
    return evaluateFilterNode(document, filter);
}

/**
 * @param {unknown} left
 * @param {unknown} right
 * @returns {number | null}
 */
function compareComparableValues(left, right) {
    const leftDate = Date.parse(String(left));
    const rightDate = Date.parse(String(right));
    if (!Number.isNaN(leftDate) && !Number.isNaN(rightDate)) {
        if (leftDate < rightDate) {
            return -1;
        }
        if (leftDate > rightDate) {
            return 1;
        }
        return 0;
    }
    if (typeof left === "number" && typeof right === "number") {
        return left < right ? -1 : left > right ? 1 : 0;
    }
    const leftString = String(left);
    const rightString = String(right);
    return leftString < rightString ? -1 : leftString > rightString ? 1 : 0;
}

/**
 * @param {unknown} value
 * @param {unknown} condition
 * @returns {boolean}
 */
function matchesCondition(value, condition) {
    if (condition == null) {
        return value == null;
    }
    if (typeof condition !== "object" || Array.isArray(condition)) {
        if (Array.isArray(value)) {
            return value.some((entry) => matchesCondition(entry, condition));
        }
        return value === condition;
    }

    if (condition.$regex instanceof RegExp) {
        return typeof value === "string" && condition.$regex.test(value);
    }
    if (typeof condition.$regex === "string") {
        return typeof value === "string" && new RegExp(condition.$regex).test(value);
    }
    if (condition.$exists !== undefined) {
        const exists = value !== undefined && value !== null;
        return condition.$exists ? exists : !exists;
    }
    if (condition.$eq !== undefined) {
        return value === condition.$eq;
    }
    if (condition.$ne !== undefined) {
        return value !== condition.$ne;
    }
    if (condition.$in) {
        return condition.$in.includes(value);
    }
    if (condition.$nin) {
        return !condition.$nin.includes(value);
    }
    if (condition.$gt !== undefined) {
        const compared = compareComparableValues(value, condition.$gt);
        return compared != null && compared > 0;
    }
    if (condition.$gte !== undefined) {
        const compared = compareComparableValues(value, condition.$gte);
        return compared != null && compared >= 0;
    }
    if (condition.$lt !== undefined) {
        const compared = compareComparableValues(value, condition.$lt);
        return compared != null && compared < 0;
    }
    if (condition.$lte !== undefined) {
        const compared = compareComparableValues(value, condition.$lte);
        return compared != null && compared <= 0;
    }
    if (condition.$elemMatch) {
        if (!Array.isArray(value)) {
            return false;
        }
        return value.some((entry) => matchesObject(entry, condition.$elemMatch));
    }
    if (Array.isArray(value)) {
        return value.some((entry) => matchesCondition(entry, condition));
    }

    if (typeof value === "object" && value != null && !Array.isArray(value)) {
        return matchesObject(value, condition);
    }

    return false;
}

/**
 * @param {Object} value
 * @param {Object} condition
 * @returns {boolean}
 */
function matchesObject(value, condition) {
    if (condition.$and) {
        return condition.$and.every((entry) => matchesObject(value, entry));
    }
    if (condition.$or) {
        return condition.$or.some((entry) => matchesObject(value, entry));
    }
    if (condition.$nor) {
        return !condition.$nor.some((entry) => matchesObject(value, entry));
    }
    for (const [key, nested] of Object.entries(condition)) {
        if (!matchesCondition(getDocumentValue(value, key), nested)) {
            return false;
        }
    }
    return true;
}

/**
 * @param {unknown} document
 * @param {Object} filter
 * @returns {boolean}
 */
function evaluateFilterNode(document, filter) {
    if (filter.$and) {
        return filter.$and.every((entry) => evaluateFilterNode(document, entry));
    }
    if (filter.$or) {
        return filter.$or.some((entry) => evaluateFilterNode(document, entry));
    }
    if (filter.$nor) {
        return !filter.$nor.some((entry) => evaluateFilterNode(document, entry));
    }

    for (const [key, condition] of Object.entries(filter)) {
        if (key.startsWith("$")) {
            continue;
        }
        const value = getDocumentValue(document, key);
        if (!matchesCondition(value, condition)) {
            return false;
        }
    }
    return true;
}

/**
 * @param {Object} document
 * @param {string} key
 * @returns {unknown}
 */
function getDocumentValue(document, key) {
    if (key.includes(".")) {
        const segments = key.split(".");
        let current = document;
        for (const segment of segments) {
            if (current == null) {
                return undefined;
            }
            if (Array.isArray(current)) {
                const values = current
                    .map((entry) => entry?.[segment])
                    .filter((entry) => entry !== undefined);
                return values.length === 1 ? values[0] : values;
            }
            current = current[segment];
        }
        return current;
    }
    return document[key];
}

/**
 * @param {string} resourceType
 * @param {string} code
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @param {Object} mainDocument
 * @param {Object} companionDocument
 * @returns {Object | null}
 */
function buildLookupHitSet(resourceType, code, plan, mainDocument, companionDocument) {
    const curated = (KNOWN_HIT_SETS[resourceType] || []).find((entry) => entry.code === code);
    if (curated) {
        const hitSet = {
            status: "defined",
            hash: hashHitSet(curated),
            positive: {
                query: curated.query,
                expectDocument: curated.expectHit
            },
            companionNegative: {
                expectDocument: curated.expectHit === "main" ? "companion" : "main"
            },
            missing: {
                applicable: true
            }
        };
        return hitSet;
    }

    const augmented = augmentDocumentForHitSet(mainDocument, plan);
    if (!augmented) {
        return null;
    }

    const query = { [code]: augmented.queryValue };
    try {
        executeSearchQueryPlan(plan, augmented.queryValue, code);
    } catch {
        return null;
    }

    const caseEntry = { code, query, expectHit: "main" };
    const syntheticAugmentation = {
        extractionPath: plan.extractionPaths[0]?.path || null,
        ...(plan.inlineTarget
            ? {
                  inlinePath: plan.inlineTarget.inlinePath,
                  targetResourceType: plan.inlineTarget.targetResourceType,
                  bundleTypePredicate: plan.inlineTarget.bundleTypePredicate
              }
            : {})
    };
    return {
        status: "defined",
        hash: hashHitSet(caseEntry),
        valueSource: "synthetic",
        positive: {
            query,
            expectDocument: "main"
        },
        companionNegative: {
            expectDocument: "companion"
        },
        missing: {
            applicable: true
        },
        syntheticAugmentation
    };
}

/**
 * @param {Object} input
 * @param {import('../registry/types').RegistrySnapshot} input.snapshot
 * @param {Object} input.fixtureArchive
 * @returns {Object}
 */
function buildHitSetArtifact({ snapshot, fixtureArchive }) {
    /** @type {Record<string, Record<string, Object>>} */
    const resources = {};
    const summary = {
        compiledLookups: 0,
        definedHitSets: 0,
        pendingHitSets: 0
    };

    for (const [resourceType, fixture] of Object.entries(fixtureArchive.resources)) {
        const mainPath = fixture.activeFixturePath;
        const companionPath = fixture.companion?.archivePath;
        if (!mainPath) {
            continue;
        }

        const fs = require("fs");
        const path = require("path");
        const mainDocument = JSON.parse(fs.readFileSync(path.resolve(mainPath), "utf8"));
        const companionDocument = companionPath
            ? JSON.parse(fs.readFileSync(path.resolve(companionPath), "utf8"))
            : { resourceType };

        /** @type {Record<string, Object>} */
        const lookups = {};

        for (const [lookupKey, definition] of snapshot.byLookupKey) {
            const [lookupResourceType, lookupCode] = lookupKey.split("::");
            if (lookupResourceType !== resourceType) {
                continue;
            }

            const plan = definition.lookupPlans?.[lookupKey]?.plan || definition.compiledPlan;
            if (!plan) {
                continue;
            }

            summary.compiledLookups += 1;
            const hitSet = buildLookupHitSet(
                resourceType,
                lookupCode,
                plan,
                mainDocument,
                companionDocument
            );

            if (hitSet) {
                summary.definedHitSets += 1;
                lookups[lookupCode] = hitSet;
            } else {
                summary.pendingHitSets += 1;
                lookups[lookupCode] = {
                    status: "pending",
                    hash: null
                };
            }
        }

        if (Object.keys(lookups).length > 0) {
            resources[resourceType] = lookups;
        }
    }

    return {
        version: 1,
        generatedAt: new Date().toISOString(),
        resources,
        summary
    };
}

module.exports = {
    buildLookupHitSet,
    buildHitSetArtifact,
    documentMatchesFilter,
    resolveExpectDocument
};
