const fs = require("fs");
const path = require("path");
const productionResources = require("@models/FHIR/fhir.resourceList.json");

const ROLLOUT_CONFIG_PATH = path.join(__dirname, "registry-rollout.json");

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

/**
 * @returns {{
 *   enabledResourceTypes: string[],
 *   shadowCompareResourceTypes: string[],
 *   enableAllProductionResources: boolean
 * }}
 */
function loadRolloutConfig() {
    try {
        const raw = fs.readFileSync(ROLLOUT_CONFIG_PATH, "utf8");
        const config = JSON.parse(raw);
        const enableAll = config.enableAllProductionResources === true;
        return {
            enableAllProductionResources: enableAll,
            enabledResourceTypes: enableAll
                ? [...productionResources]
                : config.enabledResourceTypes || [],
            shadowCompareResourceTypes: config.shadowCompareResourceTypes || []
        };
    } catch {
        return {
            enableAllProductionResources: false,
            enabledResourceTypes: [],
            shadowCompareResourceTypes: []
        };
    }
}

const rolloutConfig = loadRolloutConfig();

const envEnabled = parseList(process.env.SEARCH_REGISTRY_RESOURCE_TYPES);
const envShadow = parseList(process.env.SEARCH_REGISTRY_SHADOW_RESOURCE_TYPES);

const enabledResourceTypes = new Set([
    ...rolloutConfig.enabledResourceTypes,
    ...envEnabled
]);
const shadowCompareResourceTypes = new Set([
    ...rolloutConfig.shadowCompareResourceTypes,
    ...envShadow
]);

const featureFlags = {
    registrySearchEnabled: parseBoolean(process.env.SEARCH_REGISTRY_ENABLED, false),
    registryShadowCompare: parseBoolean(process.env.SEARCH_REGISTRY_SHADOW_COMPARE, false),
    registryEnabledResourceTypes: enabledResourceTypes,
    registryShadowCompareResourceTypes: shadowCompareResourceTypes,
    legacyFallbackEnabled: parseBoolean(process.env.SEARCH_LEGACY_FALLBACK_ENABLED, true)
};

/**
 * @param {string} resourceType
 * @returns {boolean}
 */
function isRegistryEnabledForResource(resourceType) {
    if (!featureFlags.registrySearchEnabled) {
        return false;
    }
    if (featureFlags.registryEnabledResourceTypes.size === 0) {
        return true;
    }
    return featureFlags.registryEnabledResourceTypes.has(resourceType);
}

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
    isRegistryEnabledForResource,
    isShadowCompareEnabledForResource,
    loadRolloutConfig,
    ROLLOUT_CONFIG_PATH
};
