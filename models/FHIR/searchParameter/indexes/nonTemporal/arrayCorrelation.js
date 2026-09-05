"use strict";

const { createDiagnostic } = require("./diagnostics");

/**
 * @param {string} path
 * @param {string} parentPath
 * @returns {boolean}
 */
function isPathWithin(path, parentPath) {
    return path === parentPath || path.startsWith(`${parentPath}.`);
}

/**
 * @param {string} field
 * @param {string[]} arrayPaths
 * @returns {string | undefined}
 */
function getIndexedArrayPath(field, arrayPaths) {
    return arrayPaths
        .filter((arrayPath) => isPathWithin(field, arrayPath))
        .sort((left, right) => right.length - left.length)[0];
}

/**
 * @param {string} extractionPath
 * @param {string[]} arrayPaths
 * @returns {{ valid: boolean, diagnostics: import('./types').IndexPolicyDiagnostic[] }}
 */
function validateArrayCorrelation(extractionPath, arrayPaths) {
    const diagnostics = [];
    const normalizedArrayPaths = [...new Set(arrayPaths || [])].filter(
        (arrayPath) => typeof arrayPath === "string" && arrayPath.length > 0
    );

    if (extractionPath.split(".").some((segment) => /^\d+$/.test(segment))) {
        diagnostics.push(
            createDiagnostic(
                "positional-array-path-unsupported",
                `Derived index cannot target a positional array path: ${extractionPath}`,
                { extractionPath, path: extractionPath }
            )
        );
    }

    const invalidArrayPaths = normalizedArrayPaths.filter(
        (arrayPath) => !isPathWithin(extractionPath, arrayPath)
    );
    if (invalidArrayPaths.length > 0) {
        diagnostics.push(
            createDiagnostic(
                "array-path-mismatch",
                `Array path is not an ancestor of ${extractionPath}`,
                { extractionPath, path: extractionPath, arrayPaths: invalidArrayPaths }
            )
        );
    }

    const independentArrayPaths = normalizedArrayPaths.filter(
        (arrayPath, index) =>
            !normalizedArrayPaths.some(
                (otherPath, otherIndex) =>
                    index !== otherIndex && isPathWithin(arrayPath, otherPath)
            )
    );
    if (independentArrayPaths.length > 1) {
        diagnostics.push(
            createDiagnostic(
                "parallel-multikey-paths",
                `Derived index crosses independent multikey paths for ${extractionPath}`,
                { extractionPath, path: extractionPath, arrayPaths: independentArrayPaths }
            )
        );
    }

    return {
        valid: diagnostics.length === 0,
        diagnostics,
        arrayPaths: normalizedArrayPaths,
        independentArrayPaths
    };
}

/**
 * @param {string[]} indexedFields
 * @param {string[]} arrayPaths
 * @param {string} extractionPath
 * @returns {{ valid: boolean, diagnostics: import('./types').IndexPolicyDiagnostic[] }}
 */
function validateCompoundArrayCorrelation(indexedFields, arrayPaths, extractionPath) {
    const base = validateArrayCorrelation(extractionPath, arrayPaths);
    if (!base.valid) {
        return base;
    }

    const diagnostics = [...base.diagnostics];
    const indexedArrayPaths = indexedFields
        .map((field) => getIndexedArrayPath(field, base.arrayPaths))
        .filter(Boolean);

    if (new Set(indexedArrayPaths).size > 1) {
        diagnostics.push(
            createDiagnostic(
                "parallel-multikey-index-fields",
                `Compound derived index fields use different multikey paths for ${extractionPath}`,
                { extractionPath, path: extractionPath, indexedArrayPaths }
            )
        );
    }

    return {
        valid: diagnostics.length === 0,
        diagnostics,
        arrayPaths: base.arrayPaths,
        indexedArrayPaths
    };
}

module.exports = {
    isPathWithin,
    getIndexedArrayPath,
    validateArrayCorrelation,
    validateCompoundArrayCorrelation
};
