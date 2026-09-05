"use strict";

/**
 * @param {string} code
 * @param {string} message
 * @param {Record<string, unknown>} [details]
 * @returns {import('./types').IndexPolicyDiagnostic}
 */
function createDiagnostic(code, message, details = {}) {
    return { code, message, ...details };
}

/**
 * @param {unknown} diagnostic
 * @returns {string}
 */
function serializeDiagnostic(diagnostic) {
    if (typeof diagnostic === "string") {
        return diagnostic;
    }
    if (diagnostic && typeof diagnostic === "object") {
        const record = diagnostic;
        const code = record.code || "diagnostic";
        const message = record.message || JSON.stringify(record);
        const lookupKey = record.lookupKey ? ` lookup=${record.lookupKey}` : "";
        const path = record.path || record.extractionPath;
        const pathSuffix = path ? ` path=${path}` : "";
        const keyPattern = record.keyPattern ? ` keyPattern=${record.keyPattern}` : "";
        return `${code}: ${message}${lookupKey}${pathSuffix}${keyPattern}`;
    }
    return String(diagnostic);
}

module.exports = {
    createDiagnostic,
    serializeDiagnostic
};
