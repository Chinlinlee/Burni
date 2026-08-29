const { augmentDocumentForHitSet } = require("./syntheticHitSetValues");

/**
 * @param {unknown} value
 * @returns {unknown}
 */
function toMongoDateValue(value) {
    return value;
}

/**
 * @param {Object} target
 * @param {string[]} segments
 * @param {string} datatype
 */
function normalizeDateAtPath(target, segments, datatype) {
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
    if (datatype === "Period" && current[leaf] && typeof current[leaf] === "object") {
        if ("start" in current[leaf]) {
            current[leaf].start = toMongoDateValue(current[leaf].start);
        }
        if ("end" in current[leaf]) {
            current[leaf].end = toMongoDateValue(current[leaf].end);
        }
        return;
    }
    current[leaf] = toMongoDateValue(current[leaf]);
}

/**
 * @param {Object} document
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @returns {Object}
 */
function normalizeDocumentDates(document, plan) {
    const normalized = JSON.parse(JSON.stringify(document));
    if (plan.searchType !== "date" && plan.searchType !== "dateTime") {
        return normalized;
    }
    for (const extractionPath of plan.extractionPaths) {
        normalizeDateAtPath(
            normalized,
            extractionPath.path.split("."),
            extractionPath.datatype
        );
    }
    return normalized;
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
