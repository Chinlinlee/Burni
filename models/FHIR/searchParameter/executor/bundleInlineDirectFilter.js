const {
    normalizeReferenceQueryValue,
    validateReferenceQueryValue
} = require("./referenceValueParser");

/**
 * @param {import('../compiler/searchQueryPlan').BundleInlineTarget} inlineTarget
 * @returns {Object[]}
 */
function bundleInlineGatingConditions(inlineTarget) {
    return [
        { type: inlineTarget.bundleTypePredicate },
        {
            [`${inlineTarget.inlinePath}.resourceType`]: inlineTarget.targetResourceType
        }
    ];
}

/**
 * @param {import('../compiler/searchQueryPlan').BundleInlineTarget} inlineTarget
 * @param {string} value
 * @returns {import('./referenceValueParser').ReferenceValueValidation}
 */
function validateBundleInlineDirectValue(inlineTarget, value) {
    return normalizeReferenceQueryValue(value, inlineTarget.targetResourceType);
}

/**
 * @param {import('../compiler/searchQueryPlan').BundleInlineTarget} inlineTarget
 * @param {string} value
 * @returns {Object}
 */
function buildBundleInlineIdentityFilter(inlineTarget, value) {
    const normalized = normalizeReferenceQueryValue(value, inlineTarget.targetResourceType);
    if (!normalized.valid || !normalized.normalizedValue) {
        throw new Error(normalized.reason || "Invalid reference value");
    }

    const gating = bundleInlineGatingConditions(inlineTarget);
    const normalizedValue = normalized.normalizedValue;

    if (/^https?:\/\//i.test(normalizedValue)) {
        return {
            $and: [...gating, { "entry.0.fullUrl": normalizedValue }]
        };
    }

    const id = normalizedValue.split("/").pop();
    return {
        $and: [...gating, { [`${inlineTarget.inlinePath}.id`]: id }]
    };
}

/**
 * @param {import('../compiler/searchQueryPlan').BundleInlineTarget} inlineTarget
 * @param {string} rawValue
 * @param {string | undefined} modifier
 * @returns {Object}
 */
function buildBundleInlineDirectFilter(inlineTarget, rawValue, modifier) {
    if (modifier === "missing") {
        const expectMissing = rawValue === "true";
        const present = {
            $and: [
                ...bundleInlineGatingConditions(inlineTarget),
                {
                    [`${inlineTarget.inlinePath}.id`]: {
                        $exists: true,
                        $nin: [null, ""]
                    }
                }
            ]
        };
        return expectMissing ? { $nor: [present] } : present;
    }

    const validation = validateReferenceQueryValue(rawValue);
    if (!validation.valid) {
        throw new Error(validation.reason || "Invalid reference value");
    }

    return buildBundleInlineIdentityFilter(inlineTarget, rawValue);
}

module.exports = {
    bundleInlineGatingConditions,
    validateBundleInlineDirectValue,
    buildBundleInlineIdentityFilter,
    buildBundleInlineDirectFilter
};
