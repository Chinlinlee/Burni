/**
 * @typedef {'PropertyAccess' | 'Union' | 'Where' | 'As' | 'OfType' | 'Exists' | 'Literal' | 'Identifier' | 'ResolveIs' | 'And' | 'Comparison' | 'PropertyEquals' | 'ArrayIndex'} AstNodeType
 */

/**
 * @typedef {Object} AstNode
 * @property {AstNodeType} type
 * @property {string} [name]
 * @property {AstNode} [left]
 * @property {AstNode} [right]
 * @property {AstNode} [operand]
 * @property {AstNode} [predicate]
 * @property {string} [value]
 * @property {string} [valueType]
 * @property {string} [operator]
 * @property {string} [property]
 * @property {number} [index]
 * @property {AstNode[]} [parts]
 */

/**
 * @param {AstNodeType} type
 * @param {Partial<AstNode>} fields
 * @returns {AstNode}
 */
function createNode(type, fields = {}) {
    return { type, ...fields };
}

module.exports = {
    createNode
};
