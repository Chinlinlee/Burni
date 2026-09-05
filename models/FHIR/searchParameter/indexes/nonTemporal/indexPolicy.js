"use strict";

const { isCompositeSearchType } = require("../../compiler/capabilityMatrix");
const {
    NON_TEMPORAL_SEARCH_TYPES,
    UNSUPPORTED_NUMBER_QUANTITY_COMPARATORS
} = require("./constants");
const { createDiagnostic } = require("./diagnostics");
const { evaluateKeyPatterns } = require("./keyPatterns");

/**
 * @param {import('../../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @returns {import('./types').IndexPolicyDiagnostic[]}
 */
function validateUnsupportedOperators(plan) {
    const diagnostics = [];
    if (plan.searchType === "string") {
        if (plan.modifiers?.includes("contains")) {
            diagnostics.push(
                createDiagnostic(
                    "string-contains-not-indexed",
                    "String contains mode is executable but not represented by derived B-tree indexes",
                    { lookupKey: `${plan.resourceType}::${plan.code}`, searchType: plan.searchType }
                )
            );
        } else if (!plan.modifiers?.includes("exact")) {
            diagnostics.push(
                createDiagnostic(
                    "string-prefix-not-indexed",
                    "String default prefix mode is executable but not represented by derived B-tree indexes",
                    { lookupKey: `${plan.resourceType}::${plan.code}`, searchType: plan.searchType }
                )
            );
        }
    }

    if (plan.searchType === "number" || plan.searchType === "quantity") {
        for (const comparator of plan.comparators || []) {
            if (UNSUPPORTED_NUMBER_QUANTITY_COMPARATORS.includes(comparator)) {
                diagnostics.push(
                    createDiagnostic(
                        "unsupported-comparator",
                        `Comparator ${comparator} is not supported by runtime for ${plan.searchType}`,
                        {
                            lookupKey: `${plan.resourceType}::${plan.code}`,
                            searchType: plan.searchType,
                            comparator
                        }
                    )
                );
            }
        }
    }

    return diagnostics;
}

/**
 * @param {Object} input
 * @param {import('../../registry/types').SearchParameterDefinition} input.definition
 * @param {string} input.lookupKey
 * @param {import('../../compiler/searchQueryPlan').SearchQueryPlan} input.plan
 * @returns {import('./types').LookupPolicyResult}
 */
function evaluateLookupIndexPolicy(input) {
    const { definition, lookupKey, plan } = input;
    /** @type {import('./types').IndexPolicyDiagnostic[]} */
    const diagnostics = [];

    if (definition.source !== "builtin-bundle") {
        return {
            approved: false,
            diagnostics: [
                createDiagnostic(
                    "custom-search-parameter-excluded",
                    "Database custom SearchParameter is executable but excluded from derived index manifest",
                    { lookupKey, source: definition.source }
                )
            ]
        };
    }

    if (definition.effectiveStatus !== "active") {
        return {
            approved: false,
            diagnostics: [
                createDiagnostic(
                    "lookup-disabled",
                    "Disabled SearchParameter lookup is excluded from derived index manifest",
                    { lookupKey }
                )
            ]
        };
    }

    if (!plan) {
        return {
            approved: false,
            diagnostics: [
                createDiagnostic(
                    "lookup-not-compilable",
                    "Lookup without executable plan is excluded from derived index manifest",
                    { lookupKey }
                )
            ]
        };
    }

    if (isCompositeSearchType(plan.searchType)) {
        return {
            approved: false,
            diagnostics: [
                createDiagnostic(
                    "composite-search-parameter-excluded",
                    "Composite SearchParameter is excluded from derived index manifest",
                    { lookupKey, searchType: plan.searchType }
                )
            ]
        };
    }

    if (!NON_TEMPORAL_SEARCH_TYPES.includes(plan.searchType)) {
        return {
            approved: false,
            diagnostics: [
                createDiagnostic(
                    "search-type-out-of-policy",
                    `Search type ${plan.searchType} is handled by another derived index policy`,
                    { lookupKey, searchType: plan.searchType }
                )
            ]
        };
    }

    diagnostics.push(...validateUnsupportedOperators(plan));

    if (
        plan.searchType === "string" &&
        (!plan.modifiers?.includes("exact") || plan.modifiers?.includes("contains"))
    ) {
        return {
            approved: false,
            diagnostics
        };
    }

    const choicePaths =
        (plan.extractionPaths || []).length > 1
            ? plan.extractionPaths.map((entry) => entry.path)
            : [];

    /** @type {import('./types').ApprovedIndexSpec[]} */
    const specs = [];
    for (const extractionPath of plan.extractionPaths || []) {
        const branchResult = evaluateKeyPatterns({
            plan,
            extractionPath,
            lookupKey,
            definition,
            choicePaths
        });
        diagnostics.push(...branchResult.diagnostics);
        if (branchResult.approved && branchResult.specs) {
            specs.push(...branchResult.specs);
        }
    }

    return {
        approved: specs.length > 0,
        specs,
        diagnostics
    };
}

module.exports = {
    validateUnsupportedOperators,
    evaluateLookupIndexPolicy
};
