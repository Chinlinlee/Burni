require("module-alias/register");

const fs = require("fs");
const path = require("path");
const { expect } = require("chai");

const REPO_ROOT = path.join(__dirname, "../../..");

const REMOVED_PATHS = [
    "scripts/compare-registry-legacy-shadow.js",
    "scripts/registry-rollout-status.js",
    "models/FHIR/searchParameter/runtime/shadowComparison.js",
    "models/FHIR/searchParameter/runtime/shadowDiagnostics.js",
    "test/searchParameter/shadow.test.js"
];

describe("SearchParameter shadow removal CI gate", function () {
    it("does not keep shadow or rollout-status package scripts", function () {
        const packageJson = JSON.parse(
            fs.readFileSync(path.join(REPO_ROOT, "package.json"), "utf8")
        );
        expect(packageJson.scripts).to.not.have.property("search-parameter:shadow");
        expect(packageJson.scripts).to.not.have.property("search-parameter:rollout-status");
    });

    it("does not keep shadow runtime, scripts, or tests", function () {
        for (const relativePath of REMOVED_PATHS) {
            expect(fs.existsSync(path.join(REPO_ROOT, relativePath)), relativePath).to.equal(false);
        }
    });

    it("does not export shadow comparison from the searchParameter index", function () {
        const index = require("@models/FHIR/searchParameter/index");
        expect(index.runtime).to.not.have.property("shadowComparison");
    });

    it("does not keep shadow feature flags", function () {
        const featureFlagsPath = path.join(
            REPO_ROOT,
            "models/FHIR/searchParameter/config/featureFlags.js"
        );
        expect(fs.existsSync(featureFlagsPath)).to.equal(false);
    });
});
