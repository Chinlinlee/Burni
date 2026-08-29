const { executeSearchQueryPlan } = require("../executor/mongoExecutor");
const { documentMatchesFilter } = require("./hitSetBuilder");

/**
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @param {Object} hitSet
 * @param {Object} mainDocument
 * @param {Object} companionDocument
 * @returns {{ valid: boolean, errors: string[] }}
 */
function verifyLookupHitSet(plan, hitSet, mainDocument, companionDocument) {
    const errors = [];
    if (!hitSet || hitSet.status !== "defined") {
        return { valid: false, errors: ["Hit-set is not defined"] };
    }

    const parameterName = Object.keys(hitSet.positive.query)[0];
    const rawValue = hitSet.positive.query[parameterName];
    const filter = executeSearchQueryPlan(plan, rawValue, parameterName);

    const mainMatches = documentMatchesFilter(mainDocument, filter);
    const companionMatches = documentMatchesFilter(companionDocument, filter);
    const expectedDocument = hitSet.positive.expectDocument;
    const excludedDocument = hitSet.companionNegative.expectDocument;

    if (expectedDocument === "main" && !mainMatches) {
        errors.push("Expected main fixture to match positive query");
    }
    if (expectedDocument === "companion" && !companionMatches) {
        errors.push("Expected companion fixture to match positive query");
    }
    if (excludedDocument === "main" && mainMatches && expectedDocument !== "main") {
        errors.push("Main fixture should not match positive query");
    }
    if (excludedDocument === "companion" && companionMatches && expectedDocument !== "companion") {
        errors.push("Companion fixture should not match positive query");
    }
    if (expectedDocument === "main" && excludedDocument === "companion" && companionMatches) {
        errors.push("Companion fixture should not match positive query");
    }
    if (expectedDocument === "companion" && excludedDocument === "main" && mainMatches) {
        errors.push("Main fixture should not match positive query");
    }

    return { valid: errors.length === 0, errors };
}

/**
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @param {Object} mainDocument
 * @param {Object} companionDocument
 * @returns {{ valid: boolean, errors: string[] }}
 */
function verifyMissingSemantics(plan, mainDocument, companionDocument) {
    const errors = [];
    const presentFilter = executeSearchQueryPlan(plan, "false", `${plan.code}:missing`);
    const absentFilter = executeSearchQueryPlan(plan, "true", `${plan.code}:missing`);

    if (!presentFilter || !absentFilter) {
        errors.push("Missing-value filters were not produced");
        return { valid: false, errors };
    }

    if (JSON.stringify(presentFilter) === JSON.stringify(absentFilter)) {
        errors.push("Missing true and false filters must differ");
    }

    const mainPresent = documentMatchesFilter(mainDocument, presentFilter);
    const mainAbsent = documentMatchesFilter(mainDocument, absentFilter);
    if (mainPresent && mainAbsent) {
        errors.push("Main fixture cannot satisfy both missing=true and missing=false");
    }

    const companionPresent = documentMatchesFilter(companionDocument, presentFilter);
    const companionAbsent = documentMatchesFilter(companionDocument, absentFilter);
    if (companionPresent && companionAbsent) {
        errors.push("Companion fixture cannot satisfy both missing=true and missing=false");
    }

    return { valid: errors.length === 0, errors };
}

module.exports = {
    verifyLookupHitSet,
    verifyMissingSemantics
};
