/**
 * @typedef {Object} CompositeComponentDefinition
 * @property {number} [index]
 * @property {string} definitionKey
 * @property {string} code
 * @property {string} searchType
 * @property {string[]} comparators
 * @property {string[]} modifiers
 * @property {boolean} [multipleOr]
 * @property {boolean} [multipleAnd]
 */

/**
 * @typedef {Object} CompositeBranchComponent
 * @property {number} componentIndex
 * @property {import('../compiler/searchQueryPlan').ExtractionPath} extractionPath
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

module.exports = {};
