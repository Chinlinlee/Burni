const VALID_ESCAPE_CHARS = new Set(["$", ",", "|", "\\"]);

/**
 * @typedef {Object} ParsedCompositeComponentToken
 * @property {string} value
 * @property {string | undefined} comparator
 * @property {import('./temporalQueryParser').TemporalQueryValue} [temporal]
 * @property {Error} [temporalError]
 */

/**
 * @typedef {Object} ParsedCompositePair
 * @property {string[]} components
 * @property {string[]} rawComponents
 * @property {ParsedCompositeComponentToken[]} [tokens]
 */

/**
 * @typedef {Object} ParsedCompositeValueGroup
 * @property {ParsedCompositePair[]} pairs
 */

/**
 * @typedef {Object} ParsedCompositeSearchValue
 * @property {ParsedCompositeValueGroup[]} groups
 * @property {'and' | 'or'} conjunction
 */

/**
 * @param {string} value
 * @returns {string}
 */
function unescapeCompositeLiteral(value) {
    let result = "";
    for (let index = 0; index < value.length; index += 1) {
        const char = value[index];
        if (char !== "\\") {
            result += char;
            continue;
        }
        if (index + 1 >= value.length) {
            throw new Error("Trailing escape in composite search value");
        }
        const next = value[index + 1];
        if (!VALID_ESCAPE_CHARS.has(next)) {
            throw new Error(`Invalid escape sequence \\${next} in composite search value`);
        }
        result += next;
        index += 1;
    }
    return result;
}

/**
 * @param {string} value
 * @param {string} delimiter
 * @returns {string[]}
 */
function splitOnUnescapedDelimiter(value, delimiter) {
    /** @type {string[]} */
    const parts = [];
    let current = "";
    for (let index = 0; index < value.length; index += 1) {
        const char = value[index];
        if (char === "\\") {
            if (index + 1 >= value.length) {
                throw new Error("Trailing escape in composite search value");
            }
            current += char + value[index + 1];
            index += 1;
            continue;
        }
        if (char === delimiter) {
            parts.push(current);
            current = "";
            continue;
        }
        current += char;
    }
    parts.push(current);
    return parts;
}

/**
 * @param {string} rawPair
 * @param {number} componentCount
 * @returns {string[]}
 */
function parseCompositePair(rawPair, componentCount) {
    if (!rawPair) {
        throw new Error("Missing composite Pair value");
    }

    const rawComponents = splitOnUnescapedDelimiter(rawPair, "$");
    if (rawComponents.length !== componentCount) {
        throw new Error(
            `Composite search value must contain exactly ${componentCount} components`
        );
    }

    const components = rawComponents.map((component) => {
        const unescaped = unescapeCompositeLiteral(component);
        if (!unescaped) {
            throw new Error("Composite component value must not be empty");
        }
        return unescaped;
    });

    return components;
}

/**
 * @param {string} rawPair
 * @param {number} componentCount
 * @returns {{ components: string[], rawComponents: string[] }}
 */
function parseCompositePairParts(rawPair, componentCount) {
    const rawComponents = splitOnUnescapedDelimiter(rawPair, "$");
    const components = parseCompositePair(rawPair, componentCount);
    return { components, rawComponents };
}

/**
 * @param {string} rawGroup
 * @param {number} componentCount
 * @returns {ParsedCompositePair[]}
 */
function parseCompositePairGroup(rawGroup, componentCount) {
    const rawPairs = splitOnUnescapedDelimiter(rawGroup, ",");
    if (rawPairs.length === 0) {
        throw new Error("Missing composite search value");
    }
    return rawPairs.map((rawPair) => ({
        ...parseCompositePairParts(rawPair, componentCount)
    }));
}

/**
 * @param {string} rawValue
 * @param {string} searchType
 * @returns {string}
 */
function preservePrimitiveEscapes(rawValue, searchType) {
    if (!["token", "quantity"].includes(searchType)) {
        return unescapeCompositeLiteral(rawValue);
    }

    let result = "";
    for (let index = 0; index < rawValue.length; index += 1) {
        const char = rawValue[index];
        if (char !== "\\") {
            result += char;
            continue;
        }
        if (index + 1 >= rawValue.length) {
            throw new Error("Trailing escape in composite search value");
        }
        const next = rawValue[index + 1];
        if (!VALID_ESCAPE_CHARS.has(next)) {
            throw new Error(`Invalid escape sequence \\${next} in composite search value`);
        }
        result += next === "|" ? "\\|" : next;
        index += 1;
    }
    return result;
}

/**
 * @param {string | string[]} rawValue
 * @param {number} componentCount
 * @returns {ParsedCompositeSearchValue}
 */
function parseCompositeSearchValue(rawValue, componentCount) {
    if (componentCount < 1) {
        throw new Error("Composite search parameter is missing component metadata");
    }

    const isRepeated = Array.isArray(rawValue);
    const rawGroups = isRepeated ? rawValue.map(String) : [String(rawValue)];
    if (rawGroups.length === 0 || rawGroups.some((group) => group === "")) {
        throw new Error("Missing composite search value");
    }

    return {
        groups: rawGroups.map((group) => ({
            pairs: parseCompositePairGroup(group, componentCount)
        })),
        conjunction: isRepeated ? "and" : "or"
    };
}

module.exports = {
    parseCompositeSearchValue,
    parseCompositePair,
    parseCompositePairParts,
    splitOnUnescapedDelimiter,
    unescapeCompositeLiteral,
    preservePrimitiveEscapes
};
