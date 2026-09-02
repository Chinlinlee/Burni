require("module-alias/register");

const { expect } = require("chai");
const {
    parseDecimal,
    formatDecimal,
    addDecimal,
    divideDecimalByTen
} = require("@models/FHIR/temporal");

describe("FHIR temporal arithmetic", function () {
    describe("parseDecimal", function () {
        it("parses a scaled decimal into numerator and scale", function () {
            expect(parseDecimal("1.20")).to.deep.equal({
                numerator: 120n,
                scale: 2
            });
        });
    });

    describe("formatDecimal", function () {
        it("strips trailing fractional zeros", function () {
            expect(formatDecimal(120n, 2)).to.equal("1.2");
        });
    });

    describe("addDecimal", function () {
        it("adds a positive scaled increment", function () {
            expect(addDecimal("1.20", "0.05", 1)).to.equal("1.25");
        });

        it("subtracts when rightSign is negative", function () {
            expect(addDecimal("10", "3", -1)).to.equal("7");
        });

        it("adds onto a negative left operand", function () {
            expect(addDecimal("-1.5", "0.25", 1)).to.equal("-1.25");
        });
    });

    describe("divideDecimalByTen", function () {
        it("shifts an integer one decimal place", function () {
            expect(divideDecimalByTen("1")).to.equal("0.1");
        });

        it("strips trailing zeros after the scale shift", function () {
            expect(divideDecimalByTen("0.10")).to.equal("0.01");
        });
    });
});
