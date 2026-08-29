require("module-alias/register");

const fs = require("fs");
const path = require("path");
const { expect } = require("chai");

const RUNTIME_ROOT = path.join(__dirname, "../../../models/FHIR/searchParameter/runtime");
const API_SERVICE_ROOT = path.join(__dirname, "../../../api/FHIRApiService");

const LEGACY_IMPORT_PATTERNS = [
    /ParametersHandler/,
    /paramsSearchFields/,
    /paramsSearch/,
    /require\(["']@models\/FHIR\/queryBuild["']\)/,
    /require\(["']@models\/FHIR\/searchParameterQueryHandler["']\)/,
    /require\(["'].*\/queryBuild/,
    /require\(["'].*\/searchParameterQueryHandler/
];

const RUNTIME_ENTRY_FILES = [
    "registrySearchHandler.js",
    "includeHandler.js",
    "bundleSearchValidation.js"
];

const API_ENTRY_FILES = [
    path.join("search", "searchParameterCreator.js"),
    path.join("condition-delete.js")
];

function readSource(filePath) {
    return fs.readFileSync(filePath, "utf8");
}

describe("runtime entry decoupling from legacy query builders", function () {
    it("does not import generated handlers or legacy query modules from registry runtime entry points", function () {
        const offenders = [];

        for (const fileName of RUNTIME_ENTRY_FILES) {
            const filePath = path.join(RUNTIME_ROOT, fileName);
            const content = readSource(filePath);
            for (const pattern of LEGACY_IMPORT_PATTERNS) {
                if (pattern.test(content)) {
                    offenders.push(`${fileName}: ${pattern}`);
                }
            }
        }

        expect(offenders, offenders.join("\n")).to.deep.equal([]);
    });

    it("does not import generated handlers or legacy query modules from search and conditional delete entry points", function () {
        const offenders = [];

        for (const relativePath of API_ENTRY_FILES) {
            const filePath = path.join(API_SERVICE_ROOT, relativePath);
            const content = readSource(filePath);
            for (const pattern of LEGACY_IMPORT_PATTERNS) {
                if (pattern.test(content)) {
                    offenders.push(`${relativePath}: ${pattern}`);
                }
            }
        }

        expect(offenders, offenders.join("\n")).to.deep.equal([]);
    });

    it("does not keep the legacy chain-params module", function () {
        const chainParamsPath = path.join(API_SERVICE_ROOT, "search", "chain-params.js");
        expect(fs.existsSync(chainParamsPath)).to.equal(false);
    });
});
