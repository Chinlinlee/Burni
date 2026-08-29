const { parseExpression } = require("./parser/parser");

/**
 * @typedef {Object} ParseResult
 * @property {boolean} success
 * @property {import('./parser/ast').AstNode | null} ast
 * @property {string | null} error
 */

/**
 * @param {string} expression
 * @returns {ParseResult}
 */
function parseFhirPath(expression) {
    if (!expression || typeof expression !== "string") {
        return {
            success: false,
            ast: null,
            error: "Expression is required"
        };
    }
    try {
        const ast = parseExpression(expression);
        return {
            success: true,
            ast,
            error: null
        };
    } catch (error) {
        return {
            success: false,
            ast: null,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

module.exports = {
    parseFhirPath
};
