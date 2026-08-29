const { logger } = require("@root/utils/log");
const { featureFlags } = require("../config/featureFlags");
const { executeSearchQueryPlan } = require("../executor/mongoExecutor");
const { buildLegacyFilter } = require("./legacyQueryBuilder");
const { areFiltersEqual, normalizeValue } = require("./queryComparator");
const { recordShadowResult } = require("./shadowDiagnostics");

/**
 * @param {string} searchType
 * @param {string} [parameterName]
 * @returns {string}
 */
function getSampleValue(searchType, parameterName = "") {
    if (parameterName === "gender") {
        return "male";
    }
    if (parameterName === "identifier") {
        return "http://example.org|test-id";
    }
    if (parameterName.includes("status")) {
        return "active";
    }
    if (parameterName.includes("birth") || parameterName.includes("date")) {
        return "1999-12-12";
    }

    switch (searchType) {
        case "number":
            return "eq42";
        case "date":
        case "dateTime":
            return "1999-12-12";
        case "token":
            return "official";
        case "reference":
            return "Patient/example";
        case "quantity":
            return "eq10|kg";
        case "uri":
            return "http://example.org/test";
        case "string":
        default:
            return "smith";
    }
}

/**
 * @param {Object} options
 * @param {string} options.resourceType
 * @param {string} options.parameterName
 * @param {string | string[]} [options.queryValue]
 * @param {Object} options.paramsSearch
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} options.plan
 * @param {string} [options.source]
 * @returns {Promise<Object>}
 */
async function compareWithLegacyHandler(options) {
    const rawValue = options.queryValue ?? getSampleValue(options.plan.searchType, options.parameterName);
    const value = Array.isArray(rawValue) ? String(rawValue[0]) : String(rawValue);

    const legacyResult = buildLegacyFilter(
        options.paramsSearch,
        options.parameterName,
        value
    );

    let registryFilter;
    let registryError;
    try {
        registryFilter = executeSearchQueryPlan(options.plan, value, options.parameterName);
    } catch (error) {
        registryError = error instanceof Error ? error.message : String(error);
    }

    /** @type {"match" | "mismatch" | "legacy-error" | "registry-error" | "skipped"} */
    let status = "skipped";
    let message = "";

    if (!legacyResult.ok) {
        status = "legacy-error";
        message = legacyResult.reason;
    } else if (registryError) {
        status = "registry-error";
        message = registryError;
    } else if (areFiltersEqual(legacyResult.filter, registryFilter)) {
        status = "match";
    } else {
        status = "mismatch";
        message = "Registry and legacy filters differ";
    }

    const entry = {
        source: options.source || "runtime",
        resourceType: options.resourceType,
        parameterName: options.parameterName,
        searchType: options.plan.searchType,
        canonicalKey: options.plan.canonicalKey,
        sampleValue: value,
        status,
        message,
        legacyFilter: legacyResult.ok ? normalizeValue(legacyResult.filter) : undefined,
        registryFilter: registryFilter ? normalizeValue(registryFilter) : undefined
    };

    recordShadowResult(entry);

    const shouldLog =
        featureFlags.registryShadowCompare ||
        options.source === "batch" ||
        status !== "match";

    if (shouldLog) {
        logger.info(`[Search registry shadow] ${JSON.stringify({
            resourceType: entry.resourceType,
            parameterName: entry.parameterName,
            status: entry.status,
            message: entry.message
        })}`);
    }

    return entry;
}

module.exports = {
    compareWithLegacyHandler,
    getSampleValue
};
