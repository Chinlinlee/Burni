const crypto = require("crypto");

const DEFAULT_BYTE_LENGTH = 32;

function generateRandomToken(byteLength = DEFAULT_BYTE_LENGTH) {
    return crypto.randomBytes(byteLength).toString("base64");
}

module.exports = {
    generateRandomToken,
    DEFAULT_BYTE_LENGTH
};
