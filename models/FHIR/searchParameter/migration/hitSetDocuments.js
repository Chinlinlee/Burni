const { augmentDocumentForHitSet } = require("./syntheticHitSetValues");
const { convertLegacyTemporalValue } = require("./temporalConversion");

const TEMPORAL_DATATYPES = new Set(["date", "dateTime", "instant", "Period"]);

/**
 * @param {unknown} value
 * @returns {unknown}
 */
function cloneDocumentValue(value) {
    if (value === null || typeof value !== "object") {
        return value;
    }
    if (value instanceof Date) {
        return new Date(value.getTime());
    }
    if (Array.isArray(value)) {
        return value.map((entry) => cloneDocumentValue(entry));
    }
    return Object.fromEntries(
        Object.entries(value).map(([key, entry]) => [key, cloneDocumentValue(entry)])
    );
}

/**
 * @param {Object} document
 * @returns {Object}
 */
function cloneDocument(document) {
    return /** @type {Object} */ (cloneDocumentValue(document));
}

/**
 * @param {unknown} value
 * @param {"date" | "dateTime" | "instant"} datatype
 * @param {string} path
 * @returns {unknown}
 */
function toCanonicalTemporalValue(value, datatype, path) {
    if (value === null || value === undefined) {
        return value;
    }
    return convertLegacyTemporalValue(value, datatype, path);
}

/**
 * @param {Object} target
 * @param {string[]} segments
 * @param {string} datatype
 * @param {string} [pathPrefix]
 */
function normalizeDateAtPath(target, segments, datatype, pathPrefix = "") {
    let current = target;
    for (let index = 0; index < segments.length - 1; index += 1) {
        const segment = segments[index];
        if (current == null) {
            return;
        }
        if (Array.isArray(current[segment])) {
            if (current[segment].length === 0) {
                return;
            }
            current = current[segment][0];
        } else {
            current = current[segment];
        }
    }
    const leaf = segments[segments.length - 1];
    if (!current || !(leaf in current)) {
        return;
    }
    const fieldPath = pathPrefix ? `${pathPrefix}.${leaf}` : leaf;
    if (datatype === "Period" && current[leaf] && typeof current[leaf] === "object") {
        if ("start" in current[leaf] && current[leaf].start != null) {
            current[leaf].start = toCanonicalTemporalValue(
                current[leaf].start,
                "dateTime",
                `${fieldPath}.start`
            );
        }
        if ("end" in current[leaf] && current[leaf].end != null) {
            current[leaf].end = toCanonicalTemporalValue(
                current[leaf].end,
                "dateTime",
                `${fieldPath}.end`
            );
        }
        return;
    }
    if (datatype === "date" || datatype === "dateTime" || datatype === "instant") {
        current[leaf] = toCanonicalTemporalValue(current[leaf], datatype, fieldPath);
    }
}

/**
 * @param {Object} document
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @returns {Object}
 */
function ensureTemporalArrayShape(document, plan) {
    for (const extractionPath of plan.extractionPaths) {
        const arrayPaths = extractionPath.arrayPaths || [];
        if (!arrayPaths.includes(extractionPath.path)) {
            continue;
        }

        let current = document;
        const segments = extractionPath.path.split(".");
        for (let index = 0; index < segments.length - 1; index += 1) {
            const segment = segments[index];
            if (current == null) {
                current = null;
                break;
            }
            if (Array.isArray(current[segment])) {
                if (current[segment].length === 0) {
                    current = null;
                    break;
                }
                current = current[segment][0];
            } else {
                current = current[segment];
            }
        }

        if (!current) {
            continue;
        }

        const leaf = segments[segments.length - 1];
        if (!(leaf in current) || current[leaf] == null) {
            continue;
        }
        if (!Array.isArray(current[leaf])) {
            current[leaf] = [current[leaf]];
        }
    }

    return document;
}

/**
 * @param {Object} document
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @returns {Object}
 */
function normalizeDocumentDates(document, plan) {
    const normalized = cloneDocument(document);
    for (const extractionPath of plan.extractionPaths) {
        if (!TEMPORAL_DATATYPES.has(extractionPath.datatype)) {
            continue;
        }
        normalizeDateAtPath(
            normalized,
            extractionPath.path.split("."),
            extractionPath.datatype,
            extractionPath.path
        );
    }
    return ensureTemporalArrayShape(normalized, plan);
}

/**
 * @param {Object} document
 * @param {Object} hitSet
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @returns {Object}
 */
function prepareMainDocumentForHitSet(document, hitSet, plan) {
    const prepared =
        hitSet.valueSource === "synthetic"
            ? augmentDocumentForHitSet(document, plan)?.document || document
            : document;
    return normalizeDocumentDates(prepared, plan);
}

module.exports = {
    prepareMainDocumentForHitSet,
    normalizeDocumentDates
};
