function parseBoolean(value, defaultValue) {
    if (value === undefined || value === null || value === "") {
        return defaultValue;
    }
    return value === "true" || value === "1";
}

function parseList(value) {
    if (!value) {
        return [];
    }
    return value.split(",").map((item) => item.trim()).filter(Boolean);
}

const shadowCompareResourceTypes = new Set(
    parseList(process.env.SEARCH_REGISTRY_SHADOW_RESOURCE_TYPES)
);

const featureFlags = {
    registryShadowCompare: parseBoolean(process.env.SEARCH_REGISTRY_SHADOW_COMPARE, false),
    registryShadowCompareResourceTypes: shadowCompareResourceTypes
};

/**
 * @param {string} resourceType
 * @returns {boolean}
 */
function isShadowCompareEnabledForResource(resourceType) {
    if (featureFlags.registryShadowCompare) {
        if (featureFlags.registryShadowCompareResourceTypes.size === 0) {
            return true;
        }
        return featureFlags.registryShadowCompareResourceTypes.has(resourceType);
    }
    return featureFlags.registryShadowCompareResourceTypes.has(resourceType);
}

module.exports = {
    featureFlags,
    isShadowCompareEnabledForResource
};
