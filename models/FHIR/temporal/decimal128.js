const mongoose = require("mongoose");
const { BSON } = require("bson");

/**
 * @param {unknown} value
 * @returns {value is import('mongoose').Types.Decimal128}
 */
function isDecimal128(value) {
    return (
        value instanceof mongoose.Types.Decimal128 || value instanceof BSON.Decimal128
    );
}

/**
 * @param {import('mongoose').Types.Decimal128} left
 * @param {import('mongoose').Types.Decimal128} right
 * @returns {number}
 */
function compareDecimal128(left, right) {
    const leftParts = splitDecimal128(left);
    const rightParts = splitDecimal128(right);

    if (leftParts.sign !== rightParts.sign) {
        return leftParts.sign === "-" ? -1 : 1;
    }

    const leftInteger = leftParts.integer.padStart(
        Math.max(leftParts.integer.length, rightParts.integer.length),
        "0"
    );
    const rightInteger = rightParts.integer.padStart(
        Math.max(leftParts.integer.length, rightParts.integer.length),
        "0"
    );

    if (leftInteger !== rightInteger) {
        const result = leftInteger < rightInteger ? -1 : 1;
        return leftParts.sign === "-" ? -result : result;
    }

    const maxFractionLength = Math.max(leftParts.fraction.length, rightParts.fraction.length);
    const leftFraction = leftParts.fraction.padEnd(maxFractionLength, "0");
    const rightFraction = rightParts.fraction.padEnd(maxFractionLength, "0");

    if (leftFraction === rightFraction) {
        return 0;
    }

    const result = leftFraction < rightFraction ? -1 : 1;
    return leftParts.sign === "-" ? -result : result;
}

/**
 * @param {import('mongoose').Types.Decimal128} value
 * @returns {{ sign: '-' | '+', integer: string, fraction: string }}
 */
function splitDecimal128(value) {
    const text = value.toString();
    const sign = text.startsWith("-") ? "-" : "+";
    const unsigned = sign === "-" ? text.slice(1) : text;
    const [integer = "0", fraction = ""] = unsigned.split(".");

    return { sign, integer, fraction };
}

module.exports = {
    isDecimal128,
    compareDecimal128
};
