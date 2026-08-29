/**
 * @typedef {'validation' | 'activation' | 'conflict' | 'compile' | 'capability'} DiagnosticCategory
 */

/**
 * @typedef {Object} RegistryDiagnostic
 * @property {string} code
 * @property {DiagnosticCategory} category
 * @property {string} message
 * @property {string} [canonicalKey]
 * @property {string} [lookupKey]
 * @property {string} [source]
 * @property {string} [rawStatus]
 * @property {string} [effectiveStatus]
 * @property {string} [expression]
 */

/**
 * @param {Partial<RegistryDiagnostic>} fields
 * @returns {RegistryDiagnostic}
 */
function createDiagnostic(fields) {
    return {
        code: fields.code || "unknown",
        category: fields.category || "validation",
        message: fields.message || "",
        canonicalKey: fields.canonicalKey,
        lookupKey: fields.lookupKey,
        source: fields.source,
        rawStatus: fields.rawStatus,
        effectiveStatus: fields.effectiveStatus,
        expression: fields.expression
    };
}

module.exports = {
    createDiagnostic
};
