/**
 * @typedef {'filter' | 'relation' | 'composite'} SearchQueryPlanKind
 */

/**
 * @typedef {Object} ExtractionPath
 * @property {string} path
 * @property {string} datatype
 * @property {string} [referenceTargetType]
 * @property {{ kind: 'systemEquals' | 'deceasedPresence' | 'typeEquals', value?: string }[]} [predicates]
 * @property {string[]} [arrayPaths]
 * @property {{ kind: 'same-array-element' | 'none', parentPath?: string, fields?: string[] }} [correlation]
 */

/**
 * @typedef {Object} BundleInlineTarget
 * @property {'embedded'} mode
 * @property {string} inlinePath
 * @property {string} targetResourceType
 * @property {string} bundleTypePredicate
 */

/**
 * @typedef {Object} CompositeComponentDefinition
 * @property {number} index
 * @property {string} definitionKey
 * @property {string} definitionUrl
 * @property {string} code
 * @property {string} searchType
 * @property {string} expression
 * @property {string[]} comparators
 * @property {string[]} modifiers
 * @property {boolean} multipleOr
 * @property {boolean} multipleAnd
 * @property {string[]} targets
 */

/**
 * @typedef {Object} CompositeComponentSummary
 * @property {string} canonicalKey
 * @property {string} searchType
 * @property {string} expression
 */

/**
 * @typedef {Object} CompositeBranchComponent
 * @property {number} componentIndex
 * @property {ExtractionPath} extractionPath
 */

/**
 * @typedef {Object} CompositeRootBranch
 * @property {string} [branchId]
 * @property {'scalar' | 'array-element'} correlationMode
 * @property {string} scopePath
 * @property {CompositeBranchComponent[]} components
 */

/**
 * @typedef {Object} CompositePlanMetadata
 * @property {CompositeComponentDefinition[]} components
 * @property {CompositeRootBranch[]} branches
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
 * @property {string[]} targets
 * @property {string[]} supportedValueForms
 * @property {BundleInlineTarget} [inlineTarget]
 * @property {number} depth
 * @property {number} estimatedCost
 * @property {string[]} requiredIndexes
 * @property {import('../registry/diagnostics').RegistryDiagnostic[]} diagnostics
 * @property {number} [componentCount]
 * @property {CompositeComponentSummary[]} [components]
 * @property {CompositePlanMetadata} [composite]
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
        multipleOr: fields.multipleOr !== false,
        multipleAnd: fields.multipleAnd !== false,
        comparators: fields.comparators || [],
        modifiers: fields.modifiers || [],
        chain: fields.chain,
        target: fields.target,
        targets: fields.targets || fields.target || [],
        supportedValueForms: fields.supportedValueForms || [],
        inlineTarget: fields.inlineTarget,
        depth: fields.depth ?? 0,
        estimatedCost: fields.estimatedCost ?? 1,
        requiredIndexes: fields.requiredIndexes || [],
        diagnostics: fields.diagnostics || [],
        ...(fields.componentCount !== undefined ? { componentCount: fields.componentCount } : {}),
        ...(fields.components ? { components: fields.components } : {}),
        ...(fields.composite ? { composite: fields.composite } : {})
    };
}

module.exports = {
    createSearchQueryPlan
};
