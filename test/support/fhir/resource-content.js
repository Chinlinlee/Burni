const _ = require("lodash");

/**
 * @param {string} value
 * @returns {string}
 */
function normalizeTemporalString(value) {
    if (/^\d{4}(-\d{2}(-\d{2})?)?$/.test(value)) {
        return value;
    }

    const parsed = Date.parse(value);
    if (Number.isNaN(parsed)) {
        return value;
    }

    const instant = new Date(parsed);
    const iso = instant.toISOString();
    if (iso.endsWith("T00:00:00.000Z")) {
        return iso.slice(0, 10);
    }

    return iso.replace(".000Z", "Z");
}

/**
 * @param {unknown} value
 * @returns {unknown}
 */
function stripServerManagedContent(value) {
    if (Array.isArray(value)) {
        return value.map((entry) => stripServerManagedContent(entry));
    }
    if (!_.isPlainObject(value)) {
        return value;
    }

    const clone = _.cloneDeep(value);
    delete clone.id;
    delete clone._id;

    if (_.isPlainObject(clone.meta)) {
        delete clone.meta.versionId;
        delete clone.meta.lastUpdated;
        if (Object.keys(clone.meta).length === 0) {
            delete clone.meta;
        }
    }

    for (const [key, entry] of Object.entries(clone)) {
        if (Array.isArray(entry) || _.isPlainObject(entry)) {
            clone[key] = stripServerManagedContent(entry);
        }
    }

    return clone;
}

/**
 * @param {unknown} value
 * @returns {unknown}
 */
function normalizeComparableContent(value) {
    if (Array.isArray(value)) {
        return value.map((entry) => normalizeComparableContent(entry));
    }
    if (typeof value === "string") {
        return normalizeTemporalString(value);
    }
    if (!_.isPlainObject(value)) {
        return value;
    }

    const clone = stripServerManagedContent(value);
    for (const [key, entry] of Object.entries(clone)) {
        clone[key] = normalizeComparableContent(entry);
    }

    return clone;
}

module.exports = {
    normalizeComparableContent,
    normalizeTemporalString,
    stripServerManagedContent
};
