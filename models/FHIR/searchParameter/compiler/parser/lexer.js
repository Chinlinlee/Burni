const TOKEN_TYPES = {
    IDENTIFIER: "IDENTIFIER",
    NUMBER: "NUMBER",
    DOT: "DOT",
    PIPE: "PIPE",
    LPAREN: "LPAREN",
    RPAREN: "RPAREN",
    LBRACKET: "LBRACKET",
    RBRACKET: "RBRACKET",
    STRING: "STRING",
    KEYWORD: "KEYWORD",
    EQ: "EQ",
    NEQ: "NEQ",
    EOF: "EOF"
};

const KEYWORDS = new Set(["as", "where", "ofType", "is", "exists", "true", "false", "and", "or"]);

/**
 * @param {string} input
 * @returns {{ type: string, value: string }[]}
 */
function tokenize(input) {
    /** @type {{ type: string, value: string }[]} */
    const tokens = [];
    let index = 0;

    while (index < input.length) {
        const char = input[index];
        if (/\s/.test(char)) {
            index += 1;
            continue;
        }
        if (char === ".") {
            tokens.push({ type: TOKEN_TYPES.DOT, value: "." });
            index += 1;
            continue;
        }
        if (char === "|") {
            tokens.push({ type: TOKEN_TYPES.PIPE, value: "|" });
            index += 1;
            continue;
        }
        if (char === "(") {
            tokens.push({ type: TOKEN_TYPES.LPAREN, value: "(" });
            index += 1;
            continue;
        }
        if (char === ")") {
            tokens.push({ type: TOKEN_TYPES.RPAREN, value: ")" });
            index += 1;
            continue;
        }
        if (char === "=") {
            tokens.push({ type: TOKEN_TYPES.EQ, value: "=" });
            index += 1;
            continue;
        }
        if (char === "!" && input[index + 1] === "=") {
            tokens.push({ type: TOKEN_TYPES.NEQ, value: "!=" });
            index += 2;
            continue;
        }
        if (char === "'" || char === '"') {
            const quote = char;
            let value = "";
            index += 1;
            while (index < input.length && input[index] !== quote) {
                value += input[index];
                index += 1;
            }
            index += 1;
            tokens.push({ type: TOKEN_TYPES.STRING, value });
            continue;
        }
        if (char === "[") {
            tokens.push({ type: TOKEN_TYPES.LBRACKET, value: "[" });
            index += 1;
            continue;
        }
        if (char === "]") {
            tokens.push({ type: TOKEN_TYPES.RBRACKET, value: "]" });
            index += 1;
            continue;
        }
        if (/[0-9]/.test(char)) {
            let value = "";
            while (index < input.length && /[0-9]/.test(input[index])) {
                value += input[index];
                index += 1;
            }
            tokens.push({ type: TOKEN_TYPES.NUMBER, value });
            continue;
        }
        if (/[A-Za-z_]/.test(char)) {
            let value = "";
            while (index < input.length && /[A-Za-z0-9_]/.test(input[index])) {
                value += input[index];
                index += 1;
            }
            const type = KEYWORDS.has(value) ? TOKEN_TYPES.KEYWORD : TOKEN_TYPES.IDENTIFIER;
            tokens.push({ type, value });
            continue;
        }
        throw new Error(`Unexpected character '${char}' at position ${index}`);
    }

    tokens.push({ type: TOKEN_TYPES.EOF, value: "" });
    return tokens;
}

module.exports = {
    TOKEN_TYPES,
    tokenize
};
