require("module-alias/register");

const fs = require("fs");
const path = require("path");
const { EXPECTED_RESOURCE_COUNT } = require("./fhir/resource-catalog");

const FULL_PROFILE_SPEC = "test/**/*.test.js";

/**
 * Explicit MongoDB-dependent test files. Fast profile MUST NOT include any of these.
 * Grouped by lifecycle helper for maintainability.
 */
const MONGODB_DEPENDENT_FILES = [
    // startFhirCrudTestContext (test/support/fhir/crud-test-context.js)
    "test/integration/FHIR/all-resource-crud.integration.test.js",
    "test/integration/FHIR/temporal/primitive-extension.integration.test.js",
    "test/integration/FHIR/temporal/response-serialization.integration.test.js",
    "test/integration/FHIR/temporal/round-trip.integration.test.js",
    "test/integration/FHIR/temporal/write-persistence.integration.test.js",
    "test/support/fhir/crud-test-context.test.js",
    "test/support/fhir/fhir-service.test.js",
    // startMongoMemory (test/support/mongo-memory.js)
    "test/integration/FHIR/Patient/patient-service.integration.test.js",
    // startRegistryTestContext (test/searchParameter/support/registry-test-context.js)
    "test/searchParameter/integration/patient-registry-search.integration.test.js",
    "test/searchParameter/integration/structural-mongo.integration.test.js",
    "test/searchParameter/migration/compatibility-plus-corrections.test.js",
    "test/searchParameter/migration/hit-set.test.js",
    "test/searchParameter/migration/migration.test.js",
    "test/searchParameter/migration/source-target-verification.test.js",
    "test/searchParameter/migration/temporal-search-verification.test.js",
    "test/searchParameter/registry/registry-reload-lifecycle.test.js",
    // isolated child processes with MongoMemoryServer
    "test/models/mongodb/connector-lifecycle.test.js"
];

/**
 * Globs and explicit paths excluded from the fast profile.
 * Explicit paths mirror MONGODB_DEPENDENT_FILES; globs document broader MongoDB suite areas.
 */
const FAST_PROFILE_EXCLUDE = [
    ...MONGODB_DEPENDENT_FILES,
    "test/integration/FHIR/**/*.integration.test.js",
    "test/searchParameter/integration/**/*.integration.test.js",
    "test/searchParameter/migration/migration.test.js",
    "test/searchParameter/migration/hit-set.test.js",
    "test/searchParameter/migration/compatibility-plus-corrections.test.js",
    "test/searchParameter/migration/source-target-verification.test.js",
    "test/searchParameter/migration/temporal-search-verification.test.js",
    "test/searchParameter/registry/registry-reload-lifecycle.test.js",
    "test/support/fhir/crud-test-context.test.js",
    "test/support/fhir/fhir-service.test.js",
    "test/models/mongodb/connector-lifecycle.test.js"
];

const MONGODB_DEPENDENT_SOURCE_PATTERNS = [
    /startFhirCrudTestContext/,
    /startRegistryTestContext/,
    /startMongoMemory/,
    /MongoMemoryServer/,
    /runIsolatedConnectorScenario/
];

const REPO_ROOT = path.join(__dirname, "../..");

/**
 * @returns {string[]}
 */
function listAllTestFiles() {
    /** @type {string[]} */
    const files = [];

    function walk(directory) {
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
            const absolutePath = path.join(directory, entry.name);
            if (entry.isDirectory()) {
                walk(absolutePath);
                continue;
            }
            if (!entry.name.endsWith(".test.js")) {
                continue;
            }
            files.push(
                path.relative(REPO_ROOT, absolutePath).split(path.sep).join("/")
            );
        }
    }

    walk(path.join(REPO_ROOT, "test"));

    const seen = new Set();
    return files
        .sort()
        .filter((filePath) => {
            const key = filePath.toLowerCase();
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
}

/**
 * @param {string} filePath
 * @returns {boolean}
 */
function isMongoDbDependentFile(filePath) {
    const normalized = filePath.split(path.sep).join("/");
    if (MONGODB_DEPENDENT_FILES.includes(normalized)) {
        return true;
    }

    const absolutePath = path.join(REPO_ROOT, normalized);
    if (!fs.existsSync(absolutePath)) {
        return false;
    }

    const source = fs.readFileSync(absolutePath, "utf8");
    return MONGODB_DEPENDENT_SOURCE_PATTERNS.some((pattern) => pattern.test(source));
}

/**
 * @returns {string[]}
 */
function resolveFastProfileFiles() {
    return listAllTestFiles().filter((filePath) => !isMongoDbDependentFile(filePath));
}

/**
 * Mocha spec string for the fast profile (space-separated explicit file paths).
 * @returns {string}
 */
function buildFastProfileSpec() {
    return resolveFastProfileFiles().join(" ");
}

/**
 * @param {string[]} [fastFiles]
 * @returns {{ ok: boolean, violations: string[] }}
 */
function validateFastProfileIsolation(fastFiles = resolveFastProfileFiles()) {
    const violations = fastFiles.filter((filePath) => isMongoDbDependentFile(filePath));
    return {
        ok: violations.length === 0,
        violations
    };
}

/**
 * @param {string[]} filePaths
 * @returns {{ tests: number, pending: number, executable: number, files: number }}
 */
function countTestCasesBySourceScan(filePaths) {
    let tests = 0;
    let pending = 0;

    for (const filePath of filePaths) {
        const absolutePath = path.join(REPO_ROOT, filePath);
        const source = fs.readFileSync(absolutePath, "utf8");
        const runnableMatches = source.match(/^\s*it(?:\.only)?\s*\(/gm) ?? [];
        const skippedMatches = source.match(/^\s*it\.skip\s*\(/gm) ?? [];
        tests += runnableMatches.length + skippedMatches.length;
        pending += skippedMatches.length;
    }

    return {
        files: filePaths.length,
        tests,
        pending,
        executable: tests - pending
    };
}

/**
 * @param {string[]} filePaths
 * @returns {{ tests: number, pending: number, files: number, executable: number }}
 */
function countMochaCasesFromDryRun(filePaths) {
    const { execFileSync } = require("child_process");
    const mochaBin = path.join(REPO_ROOT, "node_modules", "mocha", "bin", "mocha.js");
    const stdout = execFileSync(
        process.execPath,
        [
            mochaBin,
            "--no-config",
            "--require",
            "test/hook.js",
            "--dry-run",
            "--reporter",
            "json",
            ...filePaths
        ],
        {
            cwd: REPO_ROOT,
            encoding: "utf8",
            stdio: ["ignore", "pipe", "pipe"]
        }
    );

    const report = JSON.parse(stdout);
    const tests = Number(report.stats?.tests ?? 0);
    const pending = Number(report.stats?.pending ?? 0);

    return {
        files: filePaths.length,
        tests,
        pending,
        executable: tests - pending
    };
}

module.exports = {
    EXPECTED_RESOURCE_COUNT,
    FULL_PROFILE_SPEC,
    FAST_PROFILE_EXCLUDE,
    MONGODB_DEPENDENT_FILES,
    get FAST_PROFILE_SPEC() {
        return buildFastProfileSpec();
    },
    listAllTestFiles,
    resolveFastProfileFiles,
    buildFastProfileSpec,
    validateFastProfileIsolation,
    isMongoDbDependentFile,
    countTestCasesBySourceScan,
    countMochaCasesFromDryRun
};
