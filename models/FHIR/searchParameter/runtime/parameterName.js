const CONTROL_PARAMETERS = new Set([
    "_include",
    "_revinclude",
    "_count",
    "_offset",
    "_total",
    "_summary",
    "_pretty",
    "_format",
    "_elements",
    "_sort",
    "_contained",
    "_containedType"
]);

/**
 * @typedef {Object} ParsedSearchParameterName
 * @property {string} code
 * @property {string} [modifier]
 * @property {string} [chain]
 * @property {string} [typeFilter]
 */

/**
 * @param {string} parameterName
 * @returns {ParsedSearchParameterName}
 */
function parseSearchParameterName(parameterName) {
    const chainDot = parameterName.indexOf(".");
    if (chainDot >= 0) {
        const head = parameterName.slice(0, chainDot);
        const chain = parameterName.slice(chainDot + 1);
        const colon = head.indexOf(":");
        if (colon >= 0) {
            return {
                code: head.slice(0, colon),
                typeFilter: head.slice(colon + 1) || undefined,
                chain,
                modifier: undefined
            };
        }
        return {
            code: head,
            typeFilter: undefined,
            chain,
            modifier: undefined
        };
    }

    const colon = parameterName.indexOf(":");
    if (colon >= 0) {
        return {
            code: parameterName.slice(0, colon),
            modifier: parameterName.slice(colon + 1) || undefined,
            chain: undefined,
            typeFilter: undefined
        };
    }

    return {
        code: parameterName,
        modifier: undefined,
        chain: undefined,
        typeFilter: undefined
    };
}

/**
 * @param {string} parameterName
 * @returns {boolean}
 */
function isControlParameter(parameterName) {
    const parsed = parseSearchParameterName(parameterName);
    return CONTROL_PARAMETERS.has(parsed.code);
}

module.exports = {
    CONTROL_PARAMETERS,
    parseSearchParameterName,
    isControlParameter
};
