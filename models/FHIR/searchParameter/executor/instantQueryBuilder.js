const mongoose = require("mongoose");
const {
    INSTANT_PRECISION,
    INSTANT_PRECISION_VALUES,
    isDecimal128,
    normalizeInstantSafe
} = require("../../temporal");

const INSTANT_COMPARATORS = Object.freeze([
    "eq",
    "ne",
    "lt",
    "gt",
    "ge",
    "le",
    "sa",
    "eb",
    "ap"
]);

/**
 * @typedef {Object} InstantQueryValue
 * @property {string} rawValue
 * @property {string} value
 * @property {'instant'} kind
 * @property {'second' | 'fraction'} precision
 * @property {number} [fractionDigits]
 * @property {string} [comparator]
 * @property {import('mongoose').Types.Decimal128} epochSeconds
 */

/**
 * @param {string} value
 * @returns {{ numerator: bigint, scale: number }}
 */
function parseDecimal(value) {
    const text = String(value);
    const sign = text.startsWith("-") ? -1n : 1n;
    const unsigned = text.startsWith("-") || text.startsWith("+") ? text.slice(1) : text;
    const [integer = "0", fraction = ""] = unsigned.split(".");
    const digits = `${integer}${fraction}`.replace(/^0+(?=\d)/, "") || "0";
    return {
        numerator: sign * BigInt(digits),
        scale: fraction.length
    };
}

/**
 * @param {bigint} numerator
 * @param {number} scale
 * @returns {string}
 */
function formatDecimal(numerator, scale) {
    if (numerator === 0n) {
        return "0";
    }

    const sign = numerator < 0n ? "-" : "";
    const digits = (numerator < 0n ? -numerator : numerator)
        .toString()
        .padStart(scale + 1, "0");
    if (scale === 0) {
        return `${sign}${digits}`;
    }

    const integer = digits.slice(0, -scale) || "0";
    const fraction = digits.slice(-scale).replace(/0+$/, "");
    return fraction ? `${sign}${integer}.${fraction}` : `${sign}${integer}`;
}

/**
 * @param {string} left
 * @param {string} right
 * @param {1 | -1} rightSign
 * @returns {string}
 */
function addDecimal(left, right, rightSign) {
    const leftParts = parseDecimal(left);
    const rightParts = parseDecimal(right);
    const scale = Math.max(leftParts.scale, rightParts.scale);
    const leftScaled = leftParts.numerator * 10n ** BigInt(scale - leftParts.scale);
    const rightScaled = rightParts.numerator * 10n ** BigInt(scale - rightParts.scale);
    return formatDecimal(leftScaled + BigInt(rightSign) * rightScaled, scale);
}

/**
 * @param {string} value
 * @returns {string}
 */
function divideDecimalByTen(value) {
    const parts = parseDecimal(value);
    return formatDecimal(parts.numerator, parts.scale + 1);
}

/**
 * @param {InstantQueryValue} query
 * @returns {void}
 */
function assertInstantQueryValue(query) {
    if (!query || query.kind !== "instant") {
        throw new Error("Instant query value must have kind instant");
    }
    if (!INSTANT_PRECISION_VALUES.has(query.precision)) {
        throw new Error("Instant query precision must be second or fraction");
    }
    if (
        query.precision === INSTANT_PRECISION.FRACTION &&
        (!Number.isInteger(query.fractionDigits) || query.fractionDigits <= 0)
    ) {
        throw new Error("Instant query fractionDigits must be a positive integer");
    }
    if (
        query.precision === INSTANT_PRECISION.SECOND &&
        query.fractionDigits !== undefined
    ) {
        throw new Error("Instant query fractionDigits requires fraction precision");
    }
    if (!isDecimal128(query.epochSeconds)) {
        throw new Error("Instant query epochSeconds must be a Decimal128 value");
    }
}

/**
 * @param {string} rawValue
 * @returns {{ value: string, comparator: string | undefined }}
 */
function splitInstantComparator(rawValue) {
    for (const comparator of INSTANT_COMPARATORS) {
        if (rawValue.startsWith(comparator) && rawValue.length > comparator.length) {
            return {
                value: rawValue.slice(comparator.length),
                comparator
            };
        }
    }
    return { value: rawValue, comparator: undefined };
}

/**
 * @param {unknown} rawValue
 * @returns {InstantQueryValue}
 */
function parseInstantQueryValue(rawValue) {
    if (typeof rawValue !== "string" || rawValue.length === 0) {
        throw new Error("FHIR instant query value must be a non-empty string");
    }

    const split = splitInstantComparator(rawValue);
    const canonical = normalizeInstantSafe(split.value);
    /** @type {InstantQueryValue} */
    const query = {
        rawValue,
        value: canonical.value,
        kind: "instant",
        precision: canonical.precision,
        epochSeconds: canonical.epochSeconds
    };
    if (canonical.fractionDigits !== undefined) {
        query.fractionDigits = canonical.fractionDigits;
    }
    if (split.comparator !== undefined) {
        query.comparator = split.comparator;
    }
    return query;
}

/**
 * @param {InstantQueryValue} query
 * @returns {import('mongoose').Types.Decimal128}
 */
function getApproximationDelta(query) {
    const unit = query.precision === INSTANT_PRECISION.SECOND
        ? "1"
        : `0.${"0".repeat(query.fractionDigits - 1)}1`;
    return mongoose.Types.Decimal128.fromString(divideDecimalByTen(unit));
}

/**
 * @param {string} fieldPath
 * @param {InstantQueryValue} query
 * @param {string | undefined} [comparator]
 * @returns {Object}
 */
function buildInstantQuery(fieldPath, query, comparator = query?.comparator) {
    assertInstantQueryValue(query);
    if (!INSTANT_COMPARATORS.includes(comparator ?? "eq")) {
        throw new Error(`Unsupported instant comparator: ${comparator}`);
    }

    const field = `${fieldPath}.epochSeconds`;
    const point = query.epochSeconds;
    switch (comparator) {
        case undefined:
        case "eq":
            return { [field]: { $eq: point } };
        case "ne":
            return { [field]: { $ne: point } };
        case "lt":
        case "eb":
            return { [field]: { $lt: point } };
        case "gt":
        case "sa":
            return { [field]: { $gt: point } };
        case "ge":
            return { [field]: { $gte: point } };
        case "le":
            return { [field]: { $lte: point } };
        case "ap": {
            const delta = getApproximationDelta(query);
            return {
                [field]: {
                    $gte: mongoose.Types.Decimal128.fromString(
                        addDecimal(point.toString(), delta.toString(), -1)
                    ),
                    $lte: mongoose.Types.Decimal128.fromString(
                        addDecimal(point.toString(), delta.toString(), 1)
                    )
                }
            };
        }
        default:
            throw new Error(`Unsupported instant comparator: ${comparator}`);
    }
}

module.exports = {
    INSTANT_COMPARATORS,
    splitInstantComparator,
    parseInstantQueryValue,
    buildInstantQuery
};
