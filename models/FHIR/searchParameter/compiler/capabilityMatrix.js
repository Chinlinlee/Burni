/**
 * @typedef {Object} TypeCapability
 * @property {string[]} comparators
 * @property {string[]} modifiers
 * @property {boolean} multipleOr
 * @property {boolean} multipleAnd
 */

/** @type {Record<string, TypeCapability>} */
const TYPE_CAPABILITY_MATRIX = {
    number: {
        comparators: ["eq", "ne", "gt", "lt", "ge", "le", "sa", "eb", "ap"],
        modifiers: [],
        multipleOr: true,
        multipleAnd: true
    },
    date: {
        comparators: ["eq", "ne", "gt", "lt", "ge", "le", "sa", "eb", "ap"],
        modifiers: [],
        multipleOr: true,
        multipleAnd: true
    },
    dateTime: {
        comparators: ["eq", "ne", "gt", "lt", "ge", "le", "sa", "eb", "ap"],
        modifiers: [],
        multipleOr: true,
        multipleAnd: true
    },
    string: {
        comparators: [],
        modifiers: ["contains", "exact"],
        multipleOr: true,
        multipleAnd: true
    },
    token: {
        comparators: [],
        modifiers: ["text"],
        multipleOr: true,
        multipleAnd: true
    },
    reference: {
        comparators: [],
        modifiers: [],
        multipleOr: true,
        multipleAnd: true
    },
    quantity: {
        comparators: ["eq", "ne", "gt", "lt", "ge", "le", "sa", "eb", "ap"],
        modifiers: [],
        multipleOr: true,
        multipleAnd: true
    },
    uri: {
        comparators: [],
        modifiers: ["below", "above"],
        multipleOr: true,
        multipleAnd: true
    },
    composite: {
        comparators: [],
        modifiers: [],
        multipleOr: false,
        multipleAnd: false
    },
    special: {
        comparators: [],
        modifiers: [],
        multipleOr: false,
        multipleAnd: false
    }
};

const UNIVERSAL_MODIFIERS = new Set(["missing"]);

/**
 * @param {string} type
 * @returns {TypeCapability | null}
 */
function getTypeCapability(type) {
    return TYPE_CAPABILITY_MATRIX[type] || null;
}

/**
 * @param {string} type
 * @returns {boolean}
 */
function isCompositeSearchType(type) {
    return type === "composite";
}

/**
 * @param {string} type
 * @returns {boolean}
 */
function isPrimitiveSearchType(type) {
    return Boolean(TYPE_CAPABILITY_MATRIX[type]) && !["composite", "special"].includes(type);
}

/**
 * @param {string} type
 * @returns {boolean}
 */
function isSupportedSearchType(type) {
    return isPrimitiveSearchType(type);
}

/**
 * @param {string} type
 * @returns {boolean}
 */
function isKnownSearchType(type) {
    return Boolean(TYPE_CAPABILITY_MATRIX[type]);
}

/**
 * @param {string} type
 * @param {string | undefined} modifier
 * @param {string | undefined} comparator
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateOperator(type, modifier, comparator) {
    const capability = getTypeCapability(type);
    if (!capability) {
        return { valid: false, reason: `Unsupported search type: ${type}` };
    }
    if (modifier && UNIVERSAL_MODIFIERS.has(modifier)) {
        return { valid: true };
    }
    if (modifier && !capability.modifiers.includes(modifier)) {
        return { valid: false, reason: `Modifier ${modifier} is not supported for type ${type}` };
    }
    if (comparator && !capability.comparators.includes(comparator)) {
        return { valid: false, reason: `Comparator ${comparator} is not supported for type ${type}` };
    }
    return { valid: true };
}

/**
 * @param {import('./searchQueryPlan').SearchQueryPlan} plan
 * @param {string | undefined} modifier
 * @param {string | undefined} comparator
 * @returns {{ valid: boolean, reason?: string }}
 */
function validatePlanOperator(plan, modifier, comparator) {
    const typeCheck = validateOperator(plan.searchType, modifier, comparator);
    if (!typeCheck.valid) {
        return typeCheck;
    }
    if (
        modifier &&
        modifier !== "missing" &&
        plan.modifiers.length > 0 &&
        !plan.modifiers.includes(modifier)
    ) {
        return {
            valid: false,
            reason: `Modifier ${modifier} is not declared for this parameter`
        };
    }
    if (
        comparator &&
        plan.comparators.length > 0 &&
        !plan.comparators.includes(comparator)
    ) {
        return {
            valid: false,
            reason: `Comparator ${comparator} is not declared for this parameter`
        };
    }
    return { valid: true };
}

/**
 * @param {import('./searchQueryPlan').SearchQueryPlan} plan
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateCompositePlanCapability(plan) {
    if (plan.searchType !== "composite") {
        return { valid: false, reason: "Search query plan is not composite" };
    }
    if (!plan.composite?.components?.length) {
        return {
            valid: false,
            reason: "Composite search parameter is missing component metadata"
        };
    }
    if (!plan.composite.branches?.length) {
        return {
            valid: false,
            reason: "Composite search parameter is missing executable branches"
        };
    }
    return { valid: true };
}

module.exports = {
    TYPE_CAPABILITY_MATRIX,
    getTypeCapability,
    isCompositeSearchType,
    isPrimitiveSearchType,
    isSupportedSearchType,
    isKnownSearchType,
    validateOperator,
    validatePlanOperator,
    validateCompositePlanCapability
};
