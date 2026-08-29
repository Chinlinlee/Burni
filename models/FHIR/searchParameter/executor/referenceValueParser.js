/**
 * @typedef {Object} ReferenceValueValidation
 * @property {boolean} valid
 * @property {string} [reason]
 * @property {string} [normalizedValue]
 * @property {string} [resourceType]
 */

/**
 * @param {string} value
 * @returns {ReferenceValueValidation}
 */
function validateReferenceQueryValue(value) {
    if (!value || typeof value !== "string") {
        return { valid: false, reason: "Reference value is required" };
    }

    if (value.startsWith("#")) {
        return { valid: false, reason: "Contained references are not supported" };
    }

    if (value.includes("|")) {
        return { valid: false, reason: "Versioned references are not supported" };
    }

    if (value.includes("#")) {
        return { valid: false, reason: "Contained references are not supported" };
    }

    const urlMatch = /^https?:\/\//i.test(value);
    if (urlMatch) {
        const resourceType = extractResourceTypeFromReference(value);
        if (!resourceType) {
            return { valid: false, reason: "Unable to determine resource type from absolute reference URL" };
        }
        return {
            valid: true,
            normalizedValue: value,
            resourceType
        };
    }

    const parts = value.split("/").filter(Boolean);
    if (parts.length === 2) {
        return {
            valid: true,
            normalizedValue: `${parts[0]}/${parts[1]}`,
            resourceType: parts[0]
        };
    }

    if (parts.length === 1) {
        return {
            valid: true,
            normalizedValue: value,
            resourceType: undefined
        };
    }

    return { valid: false, reason: "Unsupported reference value format" };
}

/**
 * @param {string} value
 * @param {string | undefined} expectedTargetType
 * @returns {ReferenceValueValidation}
 */
function normalizeReferenceQueryValue(value, expectedTargetType) {
    const validation = validateReferenceQueryValue(value);
    if (!validation.valid) {
        return validation;
    }

    const normalizedValue = validation.normalizedValue || value;
    const resourceType = validation.resourceType || expectedTargetType;

    if (resourceType && !validation.resourceType && !normalizedValue.includes("/")) {
        return {
            valid: true,
            normalizedValue: `${resourceType}/${normalizedValue}`,
            resourceType
        };
    }

    if (expectedTargetType && resourceType && resourceType !== expectedTargetType) {
        return {
            valid: false,
            reason: `Reference value targets ${resourceType}, expected ${expectedTargetType}`
        };
    }

    return {
        valid: true,
        normalizedValue,
        resourceType: resourceType || expectedTargetType
    };
}

/**
 * @param {string} referenceValue
 * @returns {string | undefined}
 */
function extractResourceTypeFromReference(referenceValue) {
    if (!referenceValue) {
        return undefined;
    }

    if (/^https?:\/\//i.test(referenceValue)) {
        try {
            const pathname = new URL(referenceValue).pathname;
            const segments = pathname.split("/").filter(Boolean);
            const typeIndex = segments.findIndex((segment) => segment.toLowerCase() === "fhir");
            const resourceType =
                typeIndex >= 0 ? segments[typeIndex + 1] : segments[segments.length - 2];
            return resourceType || undefined;
        } catch {
            return undefined;
        }
    }

    const parts = referenceValue.split("/").filter(Boolean);
    if (parts.length >= 2) {
        return parts[0];
    }
    return undefined;
}

module.exports = {
    validateReferenceQueryValue,
    normalizeReferenceQueryValue,
    extractResourceTypeFromReference
};
