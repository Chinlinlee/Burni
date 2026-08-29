/**
 * @param {Record<string, Function>} paramsSearch
 * @param {string} parameterName
 * @param {string} rawValue
 * @returns {{ ok: true, filter: Object } | { ok: false, reason: string }}
 */
function buildLegacyFilter(paramsSearch, parameterName, rawValue) {
    if (!paramsSearch[parameterName]) {
        return {
            ok: false,
            reason: "Legacy handler is not available"
        };
    }

    const query = {
        [parameterName]: rawValue,
        $and: []
    };

    try {
        paramsSearch[parameterName](query);
        if (query.$and.length === 0) {
            return {
                ok: false,
                reason: "Legacy handler did not produce a filter"
            };
        }
        return {
            ok: true,
            filter: query.$and.length === 1 ? query.$and[0] : { $and: query.$and }
        };
    } catch (error) {
        return {
            ok: false,
            reason: error instanceof Error ? error.message : String(error)
        };
    }
}

module.exports = {
    buildLegacyFilter
};
