const _ = require("lodash");

/**
 * @param {unknown} value
 * @returns {unknown}
 */
function normalizeValue(value) {
    if (value instanceof RegExp) {
        return {
            $regex: value.source,
            $options: value.flags
        };
    }
    if (Array.isArray(value)) {
        return value.map((item) => normalizeValue(item));
    }
    if (_.isPlainObject(value)) {
        return Object.keys(value)
            .sort()
            .reduce((accumulator, key) => {
                accumulator[key] = normalizeValue(value[key]);
                return accumulator;
            }, {});
    }
    return value;
}

/**
 * @param {unknown} filter
 * @returns {unknown}
 */
function unwrapLegacyFilter(filter) {
    let current = filter;
    while (_.isPlainObject(current)) {
        if (Array.isArray(current.$or) && current.$or.length === 1 && Object.keys(current).length === 1) {
            current = current.$or[0];
            continue;
        }
        if (Array.isArray(current.$and) && current.$and.length === 1 && Object.keys(current).length === 1) {
            current = current.$and[0];
            continue;
        }
        break;
    }
    return current;
}

/**
 * @param {unknown} left
 * @param {unknown} right
 * @returns {boolean}
 */
function areFiltersEqual(left, right) {
    const normalizedLeft = normalizeValue(unwrapLegacyFilter(left));
    const normalizedRight = normalizeValue(unwrapLegacyFilter(right));
    return _.isEqual(normalizedLeft, normalizedRight);
}

module.exports = {
    normalizeValue,
    areFiltersEqual
};
