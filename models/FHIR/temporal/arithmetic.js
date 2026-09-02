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
    const digits = (numerator < 0n ? -numerator : numerator).toString().padStart(scale + 1, "0");
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

module.exports = {
    parseDecimal,
    formatDecimal,
    addDecimal,
    divideDecimalByTen
};
