const { URL } = require("url");

const URI_SCHEME_PATTERN = /^[A-Za-z][A-Za-z0-9+.-]*:/;
const INVALID_PERCENT_ENCODING = /%(?![0-9A-Fa-f]{2})/;
const HIERARCHICAL_ABSOLUTE_URI =
    /^([A-Za-z][A-Za-z0-9+.-]*):(\/\/)([^/?#]*)([^?#]*)/;

/**
 * @typedef {Object} UriValueValidation
 * @property {boolean} valid
 * @property {string} [reason]
 */

/**
 * @typedef {Object} RawHierarchicalUri
 * @property {string} origin
 * @property {string} path
 */

/**
 * @param {string} value
 * @returns {boolean}
 */
function hasInvalidUriCharacters(value) {
    for (let index = 0; index < value.length; index += 1) {
        const code = value.charCodeAt(index);
        if (code <= 0x1f || code === 0x7f || /\s/.test(value[index])) {
            return true;
        }
    }
    return false;
}

/**
 * @param {string} value
 * @returns {boolean}
 */
function hasValidPercentEncoding(value) {
    return !INVALID_PERCENT_ENCODING.test(value);
}

/**
 * @param {string} value
 * @returns {boolean}
 */
function isValidUriSyntax(value) {
    if (typeof value !== "string" || value.length === 0) {
        return false;
    }
    if (hasInvalidUriCharacters(value)) {
        return false;
    }
    if (!hasValidPercentEncoding(value)) {
        return false;
    }

    try {
        if (URI_SCHEME_PATTERN.test(value)) {
            new URL(value);
            return true;
        }
        new URL(value, "http://example.invalid");
        return true;
    } catch {
        return false;
    }
}

/**
 * @param {string} value
 * @returns {boolean}
 */
function isHierarchicalAbsoluteUri(value) {
    if (/^urn:/i.test(value)) {
        return false;
    }
    return HIERARCHICAL_ABSOLUTE_URI.test(value);
}

/**
 * @param {string} value
 * @param {string | undefined} modifier
 * @returns {UriValueValidation}
 */
function validateUriQueryValue(value, modifier) {
    if (!isValidUriSyntax(value)) {
        return { valid: false, reason: "Invalid uri search value" };
    }

    if ((modifier === "above" || modifier === "below") && !isHierarchicalAbsoluteUri(value)) {
        return { valid: false, reason: "Invalid uri search value" };
    }

    return { valid: true };
}

/**
 * Preserves the raw scheme, authority, and path from the input value.
 * Query and fragment are excluded from the returned path.
 *
 * @param {string} value
 * @returns {RawHierarchicalUri}
 */
function parseRawHierarchicalUri(value) {
    const match = HIERARCHICAL_ABSOLUTE_URI.exec(value);
    if (!match) {
        throw new Error("Invalid uri search value");
    }

    const scheme = match[1];
    const authority = match[3];
    const path = match[4] || "";

    return {
        origin: `${scheme}://${authority}`,
        path
    };
}

/**
 * @param {string} value
 * @returns {string}
 */
function getUriHierarchyBase(value) {
    const { origin, path } = parseRawHierarchicalUri(value);
    return `${origin}${path}`;
}

/**
 * Builds ancestor prefixes from scheme, authority, and path only.
 * Query and fragment in the search value do not appear in the prefix set.
 *
 * @param {string} value
 * @returns {string[]}
 */
function buildUriHierarchyPrefixes(value) {
    const { origin, path } = parseRawHierarchicalUri(value);
    if (!path) {
        return [origin];
    }

    const segments = path.split("/");
    const prefixes = [];

    for (let index = 0; index < segments.length; index += 1) {
        prefixes.push(`${origin}${segments.slice(0, index + 1).join("/")}`);
    }

    return prefixes;
}

/**
 * @param {string} value
 * @returns {string}
 */
function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * @param {string} value
 * @returns {{ $regex: RegExp }}
 */
function buildUriBelowMatcher(value) {
    const prefix = getUriHierarchyBase(value);
    const escaped = escapeRegex(prefix);

    if (prefix.endsWith("/")) {
        return {
            $regex: new RegExp(`^${escaped}(.*)?$`)
        };
    }

    return {
        $regex: new RegExp(`^${escaped}(\\/[^/].*)?$`)
    };
}

/**
 * @param {string} value
 * @param {string | undefined} modifier
 * @returns {string | Object}
 */
function buildUriQueryMatcher(value, modifier) {
    if (modifier === "below") {
        return buildUriBelowMatcher(value);
    }
    if (modifier === "above") {
        return { $in: buildUriHierarchyPrefixes(value) };
    }
    return value;
}

/**
 * @param {string} value
 * @param {string} fieldPath
 * @param {string | undefined} modifier
 * @returns {Object}
 */
function buildUriSearchFilter(value, fieldPath, modifier) {
    const validation = validateUriQueryValue(value, modifier);
    if (!validation.valid) {
        throw new Error(validation.reason || "Invalid uri search value");
    }
    return { [fieldPath]: buildUriQueryMatcher(value, modifier) };
}

module.exports = {
    validateUriQueryValue,
    isValidUriSyntax,
    isHierarchicalAbsoluteUri,
    parseRawHierarchicalUri,
    buildUriHierarchyPrefixes,
    buildUriBelowMatcher,
    buildUriQueryMatcher,
    buildUriSearchFilter,
    getUriHierarchyBase
};
