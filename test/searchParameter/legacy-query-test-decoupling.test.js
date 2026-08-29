require("module-alias/register");

const fs = require("fs");
const path = require("path");
const { expect } = require("chai");

const TEST_ROOT = path.join(__dirname, "..");
const LEGACY_IMPORT_PATTERNS = [
    /require\(["']@root\/models\/FHIR\/queryBuild["']\)/,
    /require\(["']@models\/FHIR\/queryBuild["']\)/,
    /require\(["']@root\/models\/FHIR\/searchParameterQueryHandler["']\)/,
    /require\(["']@models\/FHIR\/searchParameterQueryHandler["']\)/,
    /require\(["'].*\/queryBuild["']\)/,
    /require\(["'].*\/searchParameterQueryHandler["']\)/
];
const ALLOWLIST = new Set([
    path.join(TEST_ROOT, "searchParameter/compatibility-plus-corrections.test.js")
]);

function listTestFiles(dir) {
    const files = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...listTestFiles(fullPath));
            continue;
        }
        if (entry.name.endsWith(".test.js")) {
            files.push(fullPath);
        }
    }
    return files;
}

describe("legacy query test decoupling", function () {
    it("does not import queryBuild or searchParameterQueryHandler from test files", function () {
        const offenders = [];

        for (const filePath of listTestFiles(TEST_ROOT)) {
            if (ALLOWLIST.has(filePath)) {
                continue;
            }

            const content = fs.readFileSync(filePath, "utf8");
            const relativePath = path.relative(path.join(__dirname, "../.."), filePath);
            for (const pattern of LEGACY_IMPORT_PATTERNS) {
                if (pattern.test(content)) {
                    offenders.push(`${relativePath}: ${pattern}`);
                    break;
                }
            }
        }

        expect(offenders, offenders.join("\n")).to.deep.equal([]);
    });
});
