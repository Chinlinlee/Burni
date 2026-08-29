const { createNode } = require("./ast");
const { TOKEN_TYPES, tokenize } = require("./lexer");

class Parser {
    /**
     * @param {string} input
     */
    constructor(input) {
        this.tokens = tokenize(input);
        this.index = 0;
    }

    /**
     * @returns {import('./ast').AstNode}
     */
    parse() {
        const node = this.parseAnd();
        this.expect(TOKEN_TYPES.EOF);
        return node;
    }

    /**
     * @returns {import('./ast').AstNode}
     */
    parseAnd() {
        let left = this.parseEquality();
        while (this.matchKeyword("and")) {
            const right = this.parseEquality();
            left = createNode("And", { left, right });
        }
        return left;
    }

    /**
     * @returns {import('./ast').AstNode}
     */
    parseEquality() {
        let left = this.parseUnion();
        if (this.match(TOKEN_TYPES.NEQ)) {
            const right = this.parseUnion();
            return createNode("Comparison", { operator: "!=", left, right });
        }
        if (this.match(TOKEN_TYPES.EQ)) {
            const right = this.parseUnion();
            return createNode("Comparison", { operator: "=", left, right });
        }
        return left;
    }

    /**
     * @returns {import('./ast').AstNode}
     */
    parseUnion() {
        let left = this.parsePostfix();
        while (this.match(TOKEN_TYPES.PIPE)) {
            const right = this.parsePostfix();
            left = createNode("Union", { left, right });
        }
        return left;
    }

    /**
     * @returns {import('./ast').AstNode}
     */
    parsePostfix() {
        let node = this.parsePrimary();
        while (true) {
            if (this.match(TOKEN_TYPES.DOT)) {
                const name = this.expectIdentifierOrKeyword();
                if (name === "where") {
                    this.expect(TOKEN_TYPES.LPAREN);
                    const predicate = this.parseWherePredicate();
                    this.expect(TOKEN_TYPES.RPAREN);
                    node = createNode("Where", { operand: node, predicate });
                    continue;
                }
                if (name === "ofType") {
                    this.expect(TOKEN_TYPES.LPAREN);
                    const valueType = this.expect(TOKEN_TYPES.IDENTIFIER).value;
                    this.expect(TOKEN_TYPES.RPAREN);
                    node = createNode("OfType", { operand: node, valueType });
                    continue;
                }
                if (name === "as") {
                    this.expect(TOKEN_TYPES.LPAREN);
                    const valueType = this.expect(TOKEN_TYPES.IDENTIFIER).value;
                    this.expect(TOKEN_TYPES.RPAREN);
                    node = createNode("As", { operand: node, valueType });
                    continue;
                }
                if (name === "exists") {
                    this.expect(TOKEN_TYPES.LPAREN);
                    this.expect(TOKEN_TYPES.RPAREN);
                    node = createNode("Exists", { operand: node });
                    continue;
                }
                node = createNode("PropertyAccess", {
                    left: node,
                    name
                });
                continue;
            }
            break;
        }
        return node;
    }

    /**
     * @returns {import('./ast').AstNode}
     */
    parsePrimary() {
        if (this.match(TOKEN_TYPES.LPAREN)) {
            const inner = this.parseUnion();
            if (this.peek().type === TOKEN_TYPES.KEYWORD && this.peek().value === "as") {
                this.advance();
                const valueType = this.expect(TOKEN_TYPES.IDENTIFIER).value;
                this.expect(TOKEN_TYPES.RPAREN);
                return createNode("As", { operand: inner, valueType });
            }
            this.expect(TOKEN_TYPES.RPAREN);
            return inner;
        }

        const identifier = this.expectIdentifierOrKeywordLiteral();
        let node = createNode("Identifier", { name: identifier });
        while (this.isPostfixOperatorNext()) {
            if (!this.match(TOKEN_TYPES.DOT)) {
                break;
            }
            const name = this.expect(TOKEN_TYPES.IDENTIFIER).value;
            node = createNode("PropertyAccess", { left: node, name });
        }
        return node;
    }

    /**
     * @returns {import('./ast').AstNode}
     */
    parseWherePredicate() {
        const property = this.expect(TOKEN_TYPES.IDENTIFIER).value;
        if (property === "resolve") {
            this.expect(TOKEN_TYPES.LPAREN);
            this.expect(TOKEN_TYPES.RPAREN);
            const keyword = this.expect(TOKEN_TYPES.KEYWORD).value;
            if (keyword !== "is") {
                throw new Error("resolve() only supports resolve() is Type");
            }
            const valueType = this.expect(TOKEN_TYPES.IDENTIFIER).value;
            return createNode("ResolveIs", { valueType });
        }
        if (this.match(TOKEN_TYPES.EQ)) {
            const value = this.readLiteralValue();
            return createNode("PropertyEquals", { property, value });
        }
        if (this.peek().type === TOKEN_TYPES.STRING) {
            const value = this.expect(TOKEN_TYPES.STRING).value;
            return createNode("PropertyEquals", { property, value });
        }
        throw new Error("Unsupported where predicate");
    }

    /**
     * @returns {string}
     */
    readLiteralValue() {
        const token = this.peek();
        if (token.type === TOKEN_TYPES.STRING) {
            this.advance();
            return token.value;
        }
        if (token.type === TOKEN_TYPES.KEYWORD && (token.value === "true" || token.value === "false")) {
            this.advance();
            return token.value;
        }
        throw new Error("Expected literal value");
    }

    /**
     * @param {string} keyword
     * @returns {boolean}
     */
    matchKeyword(keyword) {
        if (this.peek().type === TOKEN_TYPES.KEYWORD && this.peek().value === keyword) {
            this.advance();
            return true;
        }
        return false;
    }

    /**
     * @returns {boolean}
     */
    isPostfixOperatorNext() {
        if (this.peek().type !== TOKEN_TYPES.DOT) {
            return false;
        }
        const next = this.tokens[this.index + 1];
        if (!next) {
            return false;
        }
        if (next.type === TOKEN_TYPES.KEYWORD) {
            return !["where", "ofType", "exists", "as"].includes(next.value);
        }
        return next.type === TOKEN_TYPES.IDENTIFIER;
    }

    /**
     * @returns {string}
     */
    expectIdentifierOrKeywordLiteral() {
        const token = this.peek();
        if (token.type === TOKEN_TYPES.IDENTIFIER) {
            this.advance();
            return token.value;
        }
        if (token.type === TOKEN_TYPES.KEYWORD && (token.value === "true" || token.value === "false")) {
            this.advance();
            return token.value;
        }
        throw new Error(`Expected identifier but got ${token.type}`);
    }

    /**
     * @returns {string}
     */
    expectIdentifierOrKeyword() {
        const token = this.peek();
        if (token.type !== TOKEN_TYPES.IDENTIFIER && token.type !== TOKEN_TYPES.KEYWORD) {
            throw new Error(`Expected identifier but got ${token.type}`);
        }
        this.advance();
        return token.value;
    }

    /**
     * @param {string} type
     * @returns {{ type: string, value: string }}
     */
    expect(type) {
        const token = this.peek();
        if (token.type !== type) {
            throw new Error(`Expected ${type} but got ${token.type}`);
        }
        this.advance();
        return token;
    }

    /**
     * @param {string} type
     * @returns {boolean}
     */
    match(type) {
        if (this.peek().type === type) {
            this.advance();
            return true;
        }
        return false;
    }

  peek() {
        return this.tokens[this.index];
    }

    advance() {
        this.index += 1;
    }
}

/**
 * @param {string} expression
 * @returns {import('./ast').AstNode}
 */
function parseExpression(expression) {
    return new Parser(expression).parse();
}

module.exports = {
    Parser,
    parseExpression
};
