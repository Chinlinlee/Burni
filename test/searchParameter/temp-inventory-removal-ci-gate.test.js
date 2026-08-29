require("module-alias/register");

const fs = require("fs");
const path = require("path");
const { expect } = require("chai");

const REPO_ROOT = path.join(__dirname, "../..");

const SCAN_ROOTS = [
    "models/FHIR/searchParameter",
    "scripts",
    "api/FHIRApiService",
    "build",
    "api_generator",
    "test"
];

const ALLOWLIST = [
    /[/\\]test[/\\]searchParameter[/\\]temp-inventory-removal-ci-gate\.test\.js$/,
    /[/\\]migration[/\\]artifacts[/\\]/,
    /[/\\]openspec[/\\]/,
    /[/\\]docs[/\\]/
];

const TEMP_INVENTORY_PATTERNS = [
    /temp[/\\]fhir-search-parameters\.json/,
    /temp[/\\]fhir-examples/
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
function referencesTempMigrationInventory(content) {
    return TEMP_INVENTORY_PATTERNS.some((pattern) => pattern.test(content));
}

/**
 * @param {string} dir
 * @returns {string[]}
 */
function listSourceFiles(dir) {
    if (!fs.existsSync(dir)) {
        return [];
    }

    const files = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...listSourceFiles(fullPath));
            continue;
        }
        if (entry.name.endsWith(".js") || entry.name.endsWith(".json")) {
            files.push(fullPath);
        }
    }
    return files;
}

/**
 * @param {string} relativeRoot
 * @returns {string[]}
 */
function findOffenders(relativeRoot) {
    const offenders = [];
    const absoluteRoot = path.join(REPO_ROOT, relativeRoot);

    for (const filePath of listSourceFiles(absoluteRoot)) {
        if (isAllowlisted(filePath)) {
            continue;
        }

        const content = fs.readFileSync(filePath, "utf8");
        if (referencesTempMigrationInventory(content)) {
            offenders.push(path.relative(REPO_ROOT, filePath));
        }
    }

    return offenders;
}

describe("SearchParameter temp inventory removal CI gate", function () {
    for (const relativeRoot of SCAN_ROOTS) {
        it(`does not reference temp migration inventory from ${relativeRoot}`, function () {
            const offenders = findOffenders(relativeRoot);
            expect(offenders, offenders.join("\n")).to.deep.equal([]);
        });
    }

    it("keeps the committed inventory diff report artifact", function () {
        const artifactPath = path.join(
            REPO_ROOT,
            "models/FHIR/searchParameter/migration/artifacts/inventory-diff-report.json"
        );
        expect(fs.existsSync(artifactPath)).to.equal(true);

        const report = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
        expect(report.inventoryLoadedByRuntime).to.equal(false);
        expect(report.summary).to.exist;
    });
});
