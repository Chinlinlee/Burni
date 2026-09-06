const { expect } = require("chai");
const crypto = require("crypto");
const {
    generateRandomToken,
    DEFAULT_BYTE_LENGTH
} = require("@root/utils/randomToken");

describe("generateRandomToken", () => {
    it("returns a base64 string with the expected length for 256-bit tokens", () => {
        const token = generateRandomToken();

        expect(token).to.be.a("string");
        expect(Buffer.from(token, "base64").length).to.equal(
            DEFAULT_BYTE_LENGTH
        );
    });

    it("honors a custom byte length", () => {
        const token = generateRandomToken(16);

        expect(Buffer.from(token, "base64").length).to.equal(16);
    });

    it("generates distinct values across calls", () => {
        const tokens = new Set(
            Array.from({ length: 20 }, () => generateRandomToken())
        );

        expect(tokens.size).to.equal(20);
    });

    it("uses crypto.randomBytes", () => {
        const randomBytesStub = crypto.randomBytes;
        const expected = Buffer.from("burni-token-test");
        crypto.randomBytes = (byteLength) => {
            expect(byteLength).to.equal(DEFAULT_BYTE_LENGTH);
            return expected;
        };

        try {
            expect(generateRandomToken()).to.equal(expected.toString("base64"));
        } finally {
            crypto.randomBytes = randomBytesStub;
        }
    });
});
