require("module-alias/register");

const fs = require("fs");
const path = require("path");
const { expect } = require("chai");

const REPO_ROOT = path.join(__dirname, "../../..");

const SCAN_ROOTS = [
    { label: "runtime", relativePath: "api/FHIRApiService" },
    { label: "models", relativePath: "models" },
    { label: "build", relativePath: "build" },
    { label: "api-generator", relativePath: "api_generator" },
    { label: "scripts", relativePath: "scripts" },
    { label: "test", relativePath: "test" }
];

const ALLOWLIST = [
    /[/\\]test[/\\]architecture[/\\]searchParameter[/\\]generated-handler-dependency-scan\.test\.js$/,
    /[/\\]test[/\\]architecture[/\\]searchParameter[/\\]runtime-search-decoupling\.test\.js$/,
    /[/\\]test[/\\]architecture[/\\]searchParameter[/\\]runtime-entry-decoupling\.test\.js$/,
    /[/\\]test[/\\]architecture[/\\]searchParameter[/\\]legacy-query-test-decoupling\.test\.js$/,
    /[/\\]test[/\\]architecture[/\\]searchParameter[/\\]legacy-artifact-removal-ci-gate\.test\.js$/,
    /[/\\]test[/\\]architecture[/\\]searchParameter[/\\]temp-inventory-removal-ci-gate\.test\.js$/,
    /[/\\]test[/\\]api_generator[/\\]api-generator-search-decoupling\.test\.js$/
];

/**
 * @param {string} filePath
 * @returns {boolean}
 */
function isAllowlisted(filePath) {
    const normalized = filePath.replace(/\\/g, "/");
    return ALLOWLIST.some((pattern) => pattern.test(normalized));
}

/**
 * @param {string} content
 * @returns {boolean}
 */
function referencesLegacySearchArtifacts(content) {
    return (
        /require\([^)]*ParametersHandler/.test(content) ||
        /ParametersHandler\.js/.test(content) ||
        content.includes("paramsSearchFields") ||
        /\bparamsSearch\b/.test(content) ||
        /FHIRParametersClean/.test(content) ||
        /require\([^)]*searchParameterQueryHandler/.test(content) ||
        /require\([^)]*queryBuild/.test(content) ||
        /require\([^)]*parameterHandler/.test(content) ||
        /require\([^)]*searchParametersCodeGenerator/.test(content) ||
        /require\([^)]*legacyQueryBuilder/.test(content) ||
        /require\([^)]*fhir-param/.test(content)
    );
}

/**
 * @param {string} dir
 * @returns {string[]}
 */
function listJsFiles(dir) {
    if (!fs.existsSync(dir)) {
        return [];
    }

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

/**
 * @param {{ label: string, relativePath: string }} root
 * @returns {string[]}
 */
function findOffenders(root) {
    const offenders = [];
    const absoluteRoot = path.join(REPO_ROOT, root.relativePath);

    for (const filePath of listJsFiles(absoluteRoot)) {
        if (isAllowlisted(filePath)) {
            continue;
        }

        const content = fs.readFileSync(filePath, "utf8");
        if (referencesLegacySearchArtifacts(content)) {
            offenders.push(path.relative(REPO_ROOT, filePath));
        }
    }

    return offenders;
}

describe("generated handler dependency scan", function () {
    for (const root of SCAN_ROOTS) {
        it(`does not depend on legacy search artifacts from ${root.label}`, function () {
            const offenders = findOffenders(root);
            expect(offenders, offenders.join("\n")).to.deep.equal([]);
        });
    }

    it("does not keep the legacy chain-params module", function () {
        const chainParamsPath = path.join(
            REPO_ROOT,
            "api/FHIRApiService/search/chain-params.js"
        );
        expect(fs.existsSync(chainParamsPath)).to.equal(false);
    });

    it("does not import legacy SearchParameter codegen from active build entry points", function () {
        const buildInitPath = path.join(REPO_ROOT, "build/init.js");
        const generatorPath = path.join(REPO_ROOT, "api_generator/API_Generator_V2.js");
        const buildInitSource = fs.readFileSync(buildInitPath, "utf8");
        const generatorSource = fs.readFileSync(generatorPath, "utf8");

        expect(buildInitSource).to.not.include("searchParametersCodeGenerator");
        expect(buildInitSource).to.not.include("parameterHandler");
        expect(generatorSource).to.not.include("searchParametersCodeGenerator");
        expect(generatorSource).to.not.include("parameterHandler");
        expect(generatorSource).to.not.include("ParametersHandler");
        expect(generatorSource).to.not.include("paramsSearch");
        expect(generatorSource).to.not.include("FHIRParametersClean");
    });
});
