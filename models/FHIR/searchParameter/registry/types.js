/**
 * @typedef {Object} SearchParameterComponent
 * @property {string} definition
 * @property {string} [expression]
 */

/**
 * @typedef {Object} SearchParameterComponentDefinition
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
 * @typedef {Object} SearchParameterResource
 * @property {string} resourceType
 * @property {string} [id]
 * @property {string} [url]
 * @property {string} [version]
 * @property {string} [name]
 * @property {string} [status]
 * @property {string} [code]
 * @property {string[]} [base]
 * @property {string} [type]
 * @property {string} [expression]
 * @property {string[]} [target]
 * @property {string[]} [chain]
 * @property {string[]} [comparator]
 * @property {string[]} [modifier]
 * @property {boolean} [multipleOr]
 * @property {boolean} [multipleAnd]
 * @property {SearchParameterComponent[]} [component]
 */

/**
 * @typedef {'builtin-bundle' | 'database'} DefinitionSource
 */

/**
 * @typedef {'active' | 'disabled'} EffectiveStatus
 */

/**
 * @typedef {Object} SearchParameterDefinition
 * @property {SearchParameterResource} resource
 * @property {DefinitionSource} source
 * @property {string} canonicalKey
 * @property {string[]} lookupKeys
 * @property {string} rawStatus
 * @property {EffectiveStatus} effectiveStatus
 * @property {string} [disableReason]
 * @property {import('./diagnostics').RegistryDiagnostic[]} diagnostics
 * @property {Record<string, { compilable: boolean, reason?: string, plan?: import('../compiler/searchQueryPlan').SearchQueryPlan }>} [lookupPlans]
 * @property {import('../compiler/searchQueryPlan').SearchQueryPlan | null} [compiledPlan]
 */

/**
 * @typedef {Object} RegistrySnapshot
 * @property {number} version
 * @property {number} loadedAt
 * @property {Map<string, SearchParameterDefinition>} byCanonicalKey
 * @property {Map<string, SearchParameterDefinition>} byLookupKey
 * @property {Set<string>} disabledLookupKeys
 * @property {Set<string>} conflictLookupKeys
 * @property {import('./diagnostics').RegistryDiagnostic[]} diagnostics
 */

module.exports = {};
