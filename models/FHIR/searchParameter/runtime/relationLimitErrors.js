/** @type {ReadonlySet<string>} */
const RELATION_LIMIT_CLASSES = new Set([
    "missing-type-filter",
    "relation-depth",
    "relation-cost"
]);

/**
 * @param {string | undefined} className
 * @returns {className is "missing-type-filter" | "relation-depth" | "relation-cost"}
 */
function isRelationLimitClass(className) {
    return typeof className === "string" && RELATION_LIMIT_CLASSES.has(className);
}

/**
 * @param {string} parameterName
 * @param {string} limitClass
 * @returns {string}
 */
function formatRelationLimitDiagnostic(parameterName, limitClass) {
    return `Invalid chained search parameter ${parameterName} (${limitClass})`;
}

class RelationLimitSearchParameterError extends Error {
    /**
     * @param {string} parameterName
     * @param {"missing-type-filter" | "relation-depth" | "relation-cost"} limitClass
     */
    constructor(parameterName, limitClass) {
        super(formatRelationLimitDiagnostic(parameterName, limitClass));
        this.name = "RelationLimitSearchParameterError";
        this.parameterName = parameterName;
        this.limitClass = limitClass;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = {
    RELATION_LIMIT_CLASSES,
    RelationLimitSearchParameterError,
    formatRelationLimitDiagnostic,
    isRelationLimitClass
};
