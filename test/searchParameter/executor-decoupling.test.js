require("module-alias/register");

const fs = require("fs");
const path = require("path");
const { expect } = require("chai");

const EXECUTOR_ROOT = path.join(
    __dirname,
    "../../models/FHIR/searchParameter/executor"
);
const LEGACY_IMPORT_PATTERNS = [
    /require\(["']@models\/FHIR\/queryBuild["']\)/,
    /require\(["']@models\/FHIR\/searchParameterQueryHandler["']\)/,
    /require\(["']\.\.\/\.\.\/queryBuild["']\)/,
    /require\(["']\.\.\/\.\.\/searchParameterQueryHandler["']\)/,
    /require\(["']\.\/queryBuild["']\)/,
    /require\(["']\.\/searchParameterQueryHandler["']\)/
];

function listJsFiles(dir) {
    const files = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...listJsFiles(fullPath));
            continue;
        }
        if (entry.name.endsWith(".js")) {
            files.push(fullPath);
        }
    }
    return files;
}

describe("Registry executor decoupling from legacy query builders", function () {
    it("does not import queryBuild or searchParameterQueryHandler from executor modules", function () {
        const offenders = [];

        for (const filePath of listJsFiles(EXECUTOR_ROOT)) {
            const content = fs.readFileSync(filePath, "utf8");
            const relativePath = path.relative(path.join(__dirname, "../.."), filePath);
            for (const pattern of LEGACY_IMPORT_PATTERNS) {
                if (pattern.test(content)) {
                    offenders.push(relativePath);
                    break;
                }
            }
        }

        expect(offenders, offenders.join("\n")).to.deep.equal([]);
    });

    it("exposes type-specific primitives without re-exporting legacy modules", function () {
        const primitives = require("@models/FHIR/searchParameter/executor/primitives");

        expect(primitives).to.have.property("buildPrimitiveFilter");
        expect(primitives).to.not.have.property("queryBuild");
        expect(primitives).to.not.have.property("searchParameterQueryHandler");
    });
});
