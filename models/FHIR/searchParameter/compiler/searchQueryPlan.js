/**
 * @typedef {'filter' | 'relation'} SearchQueryPlanKind
 */

/**
 * @typedef {Object} ExtractionPath
 * @property {string} path
 * @property {string} datatype
 * @property {string} [referenceTargetType]
 * @property {{ kind: 'systemEquals' | 'deceasedPresence', value?: string }[]} [predicates]
 */

/**
 * @typedef {Object} SearchQueryPlan
 * @property {string} canonicalKey
 * @property {string} resourceType
 * @property {string} code
 * @property {string} searchType
 * @property {SearchQueryPlanKind} kind
 * @property {ExtractionPath[]} extractionPaths
 * @property {import('./parser/ast').AstNode | null} ast
 * @property {boolean} multipleOr
 * @property {boolean} multipleAnd
 * @property {string[]} comparators
 * @property {string[]} modifiers
 * @property {string[]} [chain]
 * @property {string[]} [target]
 * @property {number} depth
 * @property {number} estimatedCost
 * @property {string[]} requiredIndexes
 * @property {import('../registry/diagnostics').RegistryDiagnostic[]} diagnostics
 */

/**
 * @param {Partial<SearchQueryPlan>} fields
 * @returns {SearchQueryPlan}
 */
function createSearchQueryPlan(fields) {
    return {
        canonicalKey: fields.canonicalKey || "",
        resourceType: fields.resourceType || "",
        code: fields.code || "",
        searchType: fields.searchType || "",
        kind: fields.kind || "filter",
        extractionPaths: fields.extractionPaths || [],
        ast: fields.ast || null,
        multipleOr: Boolean(fields.multipleOr),
        multipleAnd: Boolean(fields.multipleAnd),
        comparators: fields.comparators || [],
        modifiers: fields.modifiers || [],
        chain: fields.chain,
        target: fields.target,
        depth: fields.depth ?? 0,
        estimatedCost: fields.estimatedCost ?? 1,
        requiredIndexes: fields.requiredIndexes || [],
        diagnostics: fields.diagnostics || []
    };
}

module.exports = {
    createSearchQueryPlan
};
