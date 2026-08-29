require("module-alias/register");

const fs = require("fs");
const path = require("path");
const { expect } = require("chai");

const REPO_ROOT = path.join(__dirname, "../../..");

const REMOVED_LEGACY_PATHS = [
    "models/FHIR/searchParameterQueryHandler.js",
    "models/FHIR/queryBuild.js",
    "models/FHIR/searchParameter/runtime/legacyQueryBuilder.js",
    "api_generator/parameterHandler.js",
    "api_generator/searchParametersCodeGenerator.js",
    "api_generator/FHIRParametersClean.json",
    "utils/fhir-param.js"
];

const GENERATED_HANDLER_FILE = /[/\\]api[/\\]FHIR[/\\][^/\\]+[/\\][^/\\]+ParametersHandler\.js$/;

/**
 * @param {string} dir
 * @returns {string[]}
 */
function listGeneratedHandlerFiles(dir) {
    if (!fs.existsSync(dir)) {
        return [];
    }

    const files = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...listGeneratedHandlerFiles(fullPath));
            continue;
        }
        if (GENERATED_HANDLER_FILE.test(fullPath.replace(/\\/g, "/"))) {
            files.push(fullPath);
        }
    }
    return files;
}

describe("SearchParameter legacy artifact removal CI gate", function () {
    it("does not keep generated ParametersHandler files", function () {
        const handlerFiles = listGeneratedHandlerFiles(path.join(REPO_ROOT, "api/FHIR"));
        expect(handlerFiles).to.deep.equal([]);
    });

    it("does not keep legacy query builders, codegen helpers, or FHIRParametersClean.json", function () {
        for (const relativePath of REMOVED_LEGACY_PATHS) {
            expect(fs.existsSync(path.join(REPO_ROOT, relativePath)), relativePath).to.equal(false);
        }
    });
});
