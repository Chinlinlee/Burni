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
        modifiers: ["text", "not", "above", "below", "in", "not-in"],
        multipleOr: true,
        multipleAnd: true
    },
    reference: {
        comparators: [],
        modifiers: ["identifier"],
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
function isSupportedSearchType(type) {
    return Boolean(TYPE_CAPABILITY_MATRIX[type]) && !["composite", "special"].includes(type);
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

module.exports = {
    TYPE_CAPABILITY_MATRIX,
    getTypeCapability,
    isSupportedSearchType,
    validateOperator
};
