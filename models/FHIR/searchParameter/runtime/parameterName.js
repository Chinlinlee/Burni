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
 * @typedef {Object} ParsedHop
 * @property {string} code
 * @property {string} [typeFilter]
 */

/**
 * @typedef {Object} ParsedTerminal
 * @property {string} code
 * @property {string} [modifier]
 */

/**
 * @typedef {Object} ParsedSearchParameterName
 * @property {string} code
 * @property {string} [modifier]
 * @property {string} [chain]
 * @property {string} [typeFilter]
 * @property {ParsedHop[]} hops
 * @property {ParsedTerminal} terminal
 */

/**
 * @param {string} segment
 * @param {"typeFilter" | "modifier"} colonRole
 * @returns {{ code: string, typeFilter?: string, modifier?: string }}
 */
function parseSegment(segment, colonRole) {
    const colon = segment.indexOf(":");
    if (colon >= 0) {
        const code = segment.slice(0, colon);
        const suffix = segment.slice(colon + 1) || undefined;
        if (colonRole === "typeFilter") {
            return { code, typeFilter: suffix };
        }
        return { code, modifier: suffix };
    }
    if (colonRole === "typeFilter") {
        return { code: segment, typeFilter: undefined };
    }
    return { code: segment, modifier: undefined };
}

/**
 * @param {string} parameterName
 * @returns {ParsedSearchParameterName}
 */
function parseSearchParameterName(parameterName) {
    const dot = parameterName.indexOf(".");
    if (dot >= 0) {
        const segments = parameterName.split(".");
        const terminalSegment = segments[segments.length - 1];
        const hopSegments = segments.slice(0, -1);
        const hops = hopSegments.map((segment) => {
            const parsed = parseSegment(segment, "typeFilter");
            return { code: parsed.code, typeFilter: parsed.typeFilter };
        });
        const terminalParsed = parseSegment(terminalSegment, "modifier");
        const head = hops[0];
        return {
            code: head.code,
            typeFilter: head.typeFilter,
            chain: parameterName.slice(dot + 1),
            modifier: undefined,
            hops,
            terminal: { code: terminalParsed.code, modifier: terminalParsed.modifier }
        };
    }

    const terminalParsed = parseSegment(parameterName, "modifier");
    return {
        code: terminalParsed.code,
        modifier: terminalParsed.modifier,
        chain: undefined,
        typeFilter: undefined,
        hops: [],
        terminal: { code: terminalParsed.code, modifier: terminalParsed.modifier }
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
