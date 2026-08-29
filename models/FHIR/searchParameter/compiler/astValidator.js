const DISALLOWED_STANDALONE_FUNCTIONS = new Set([
    "memberOf",
    "subsumes",
    "translate",
    "extension",
    "trace",
    "today",
    "now",
    "timeOfDay"
]);

const ALLOWED_SYSTEM_PREDICATE_VALUES = new Set(["email", "phone"]);

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid
 * @property {string[]} errors
 */

/**
 * @param {import('./parser/ast').AstNode} node
 * @param {string[]} errors
 * @param {{ inWherePredicate?: boolean }} context
 */
function validateAstNode(node, errors, context = {}) {
    switch (node.type) {
        case "Identifier": {
            const name = node.name || "";
            if (!context.inWherePredicate && name === "resolve") {
                errors.push("resolve() is only allowed inside where(resolve() is Type)");
                return;
            }
            if (DISALLOWED_STANDALONE_FUNCTIONS.has(name)) {
                errors.push(`Function ${name} is not allowed`);
            }
            return;
        }
        case "PropertyAccess":
            validateAstNode(node.left, errors, context);
            return;
        case "Union":
            validateAstNode(node.left, errors, context);
            validateAstNode(node.right, errors, context);
            return;
        case "And":
            validateAstNode(node.left, errors, context);
            validateAstNode(node.right, errors, context);
            return;
        case "Comparison":
            validateComparison(node, errors);
            return;
        case "Where":
            validateAstNode(node.operand, errors, context);
            if (node.predicate) {
                validateWherePredicate(node.predicate, errors);
            } else {
                errors.push("where() requires a predicate");
            }
            return;
        case "As":
            if (context.inWherePredicate) {
                validateResolvePredicate(node, errors);
                return;
            }
            validateAstNode(node.operand, errors, context);
            return;
        case "ResolveIs":
            validateResolvePredicate(node, errors);
            return;
        case "PropertyEquals":
            validatePropertyEqualsPredicate(node, errors);
            return;
        case "OfType":
            errors.push("ofType is not supported");
            validateAstNode(node.operand, errors, context);
            return;
        case "Exists":
            validateAstNode(node.operand, errors, context);
            return;
        case "Literal":
            if (context.inWherePredicate) {
                errors.push("Literal where comparison is not supported");
            }
            return;
        default:
            errors.push(`Unsupported AST node type: ${node.type}`);
    }
}

/**
 * @param {import('./parser/ast').AstNode} predicate
 * @param {string[]} errors
 */
function validateWherePredicate(predicate, errors) {
    if (predicate.type === "ResolveIs") {
        validateResolvePredicate(predicate, errors);
        return;
    }
    if (predicate.type === "As") {
        validateResolvePredicate(predicate, errors);
        return;
    }
    if (predicate.type === "PropertyEquals") {
        validatePropertyEqualsPredicate(predicate, errors);
        return;
    }
    if (predicate.type === "Literal") {
        errors.push("Literal where comparison is not supported");
        return;
    }
    errors.push("Unsupported where predicate");
}

/**
 * @param {import('./parser/ast').AstNode} node
 * @param {string[]} errors
 */
function validatePropertyEqualsPredicate(node, errors) {
    if (node.property !== "system") {
        errors.push("Only system literal where predicates are supported");
        return;
    }
    if (!ALLOWED_SYSTEM_PREDICATE_VALUES.has(node.value || "")) {
        errors.push("Only system='email' or system='phone' predicates are supported");
    }
}

/**
 * @param {import('./parser/ast').AstNode} node
 * @param {string[]} errors
 */
function validateComparison(node, errors) {
    if (node.operator !== "!=") {
        errors.push("Only != comparisons are supported");
        return;
    }
    const right = node.right;
    if (
        right?.type !== "Identifier" ||
        (right.name !== "false" && right.name !== "true")
    ) {
        errors.push("Only != false or != true comparisons are supported");
    }
}

/**
 * @param {import('./parser/ast').AstNode} node
 * @param {string[]} errors
 */
function validateResolvePredicate(node, errors) {
    if (node.type === "ResolveIs") {
        if (!node.valueType) {
            errors.push("resolve() is Type requires a target type");
        }
        return;
    }
    if (node.type === "As") {
        const operand = node.operand;
        if (operand?.type !== "Identifier" || operand.name !== "resolve") {
            errors.push("where() only supports resolve() is Type");
            return;
        }
        if (!node.valueType) {
            errors.push("resolve() is Type requires a target type");
        }
        return;
    }
    errors.push("where() only supports resolve() is Type");
}

/**
 * @param {import('./parser/ast').AstNode | null} ast
 * @returns {ValidationResult}
 */
function validateAst(ast) {
    const errors = [];
    if (!ast) {
        return { valid: false, errors: ["AST is required"] };
    }
    validateAstNode(ast, errors);
    return {
        valid: errors.length === 0,
        errors
    };
}

function formatPath(entry) {
    const path = entry.segments.join(".");
    if (!entry.rootType) {
        return path;
    }
    return path ? `${entry.rootType}.${path}` : entry.rootType;
}

/**
 * @param {import('./parser/ast').AstNode} node
 * @returns {string[]}
 */
function extractFieldPaths(node) {
    return extractRawPaths(node).map(formatPath).filter(Boolean);
}

/**
 * @param {string} baseName
 * @param {string} valueType
 * @returns {string}
 */
function toChoiceElementName(baseName, valueType) {
    if (!valueType) {
        return baseName;
    }
    return `${baseName}${valueType.charAt(0).toUpperCase()}${valueType.slice(1)}`;
}

/**
 * @param {import('./parser/ast').AstNode} node
 * @param {string} [resourceType]
 * @returns {{ rootType: string, segments: string[] }[]}
 */
function extractRawPaths(node, resourceType = "") {
    switch (node.type) {
        case "Identifier":
            return [{ rootType: node.name || resourceType, segments: [] }];
        case "PropertyAccess": {
            const parentPaths = extractRawPaths(node.left, resourceType);
            return parentPaths.map((entry) => ({
                rootType: entry.rootType,
                segments: [...entry.segments, node.name || ""]
            }));
        }
        case "Union":
            return [
                ...extractRawPaths(node.left, resourceType),
                ...extractRawPaths(node.right, resourceType)
            ];
        case "And":
            return [
                ...extractRawPaths(node.left, resourceType),
                ...extractRawPaths(node.right, resourceType)
            ];
        case "Comparison":
            return extractRawPaths(node.left, resourceType);
        case "As":
        case "OfType": {
            const operandPaths = extractRawPaths(node.operand, resourceType);
            return operandPaths.map((entry) => {
                const segments = [...entry.segments];
                const last = segments.pop() || "";
                return {
                    rootType: entry.rootType,
                    segments: [...segments, toChoiceElementName(last, node.valueType || "")]
                };
            });
        }
        case "Exists": {
            const operandPaths = extractRawPaths(node.operand, resourceType);
            return operandPaths.map((entry) => {
                const segments = [...entry.segments];
                const last = segments.pop() || "";
                return {
                    rootType: entry.rootType,
                    segments: [...segments, toChoiceElementName(last, "boolean")]
                };
            });
        }
        case "Where":
            return extractRawPaths(node.operand, resourceType);
        default:
            return [];
    }
}

/**
 * @param {import('./parser/ast').AstNode} node
 * @returns {string | undefined}
 */
function extractReferenceTargetType(node) {
    if (node.type === "Where" && node.predicate) {
        if (node.predicate.type === "ResolveIs") {
            return node.predicate.valueType;
        }
        if (
            node.predicate.type === "As" &&
            node.predicate.operand?.type === "Identifier" &&
            node.predicate.operand.name === "resolve"
        ) {
            return node.predicate.valueType;
        }
    }
    return undefined;
}

/**
 * @param {import('./parser/ast').AstNode} ast
 * @returns {boolean}
 */
function hasDeceasedNotFalsePredicate(ast) {
    if (!ast) {
        return false;
    }
    if (ast.type === "And") {
        return hasDeceasedNotFalsePredicate(ast.left) || hasDeceasedNotFalsePredicate(ast.right);
    }
    if (ast.type === "Comparison" && ast.operator === "!=") {
        const right = ast.right;
        return right?.type === "Identifier" && right.name === "false";
    }
    return false;
}

/**
 * @param {import('./parser/ast').AstNode} node
 * @returns {{ property: string, value: string } | undefined}
 */
function extractSystemPredicate(node) {
    if (node.type === "Where" && node.predicate?.type === "PropertyEquals") {
        return {
            property: node.predicate.property || "",
            value: node.predicate.value || ""
        };
    }
    if (node.type === "Union") {
        return extractSystemPredicate(node.left) || extractSystemPredicate(node.right);
    }
    return undefined;
}

module.exports = {
    validateAst,
    extractFieldPaths,
    extractRawPaths,
    extractReferenceTargetType,
    hasDeceasedNotFalsePredicate,
    extractSystemPredicate,
    toChoiceElementName
};
