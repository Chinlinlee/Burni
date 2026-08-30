require("module-alias/register");

const crypto = require("crypto");
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { expect } = require("chai");

const REPO_ROOT = path.join(__dirname, "../..");
const GENERATOR_SOURCE_DIR = "FHIR-mongoose-Models-Generator";
const GENERATED_SCHEMA_DIR = path.join(
    REPO_ROOT,
    "models/mongodb/FHIRDataTypesSchema"
);
const GENERATOR_SCRIPT = path.join(
    REPO_ROOT,
    "scripts/run-fhir-schema-generators.js"
);

/**
 * Generator source for FHIR mongoose schemas lives in {@link GENERATOR_SOURCE_DIR}.
 * `scripts/run-fhir-schema-generators.js` orchestrates PrimitiveGenerator,
 * ComplexGenerator, resourceGenerator, and history_model_Generator to emit
 * files under models/mongodb/FHIRDataTypesSchema/ and related model paths.
 */

/**
 * @param {string} dir
 * @returns {string[]}
 */
function listJsFiles(dir) {
    return fs
        .readdirSync(dir)
        .filter((name) => name.endsWith(".js"))
        .map((name) => path.join(dir, name))
        .sort();
}

/**
 * @param {string[]} filePaths
 * @returns {Map<string, string>}
 */
function hashJsFiles(filePaths) {
    const hashes = new Map();
    for (const filePath of filePaths) {
        const content = fs.readFileSync(filePath);
        const digest = crypto.createHash("sha256").update(content).digest("hex");
        hashes.set(path.relative(REPO_ROOT, filePath), digest);
    }
    return hashes;
}

function runGenerator() {
    execFileSync(process.execPath, [GENERATOR_SCRIPT], {
        cwd: REPO_ROOT,
        stdio: "pipe"
    });
}

describe("FHIR schema generator idempotency CI gate", function () {
    this.timeout(600000);

    it("documents generator source location", function () {
        const generatorDir = path.join(REPO_ROOT, GENERATOR_SOURCE_DIR);
        expect(fs.existsSync(generatorDir), GENERATOR_SOURCE_DIR).to.equal(true);
        expect(
            fs.existsSync(path.join(generatorDir, "PrimitiveGenerator.js"))
        ).to.equal(true);
        expect(
            fs.existsSync(path.join(generatorDir, "ComplexGenerator.js"))
        ).to.equal(true);
        expect(fs.existsSync(GENERATOR_SCRIPT)).to.equal(true);
    });

    it("produces identical FHIRDataTypesSchema output on consecutive runs", function () {
        runGenerator();

        const schemaFiles = listJsFiles(GENERATED_SCHEMA_DIR);
        expect(schemaFiles.length).to.be.greaterThan(0);

        const hashesAfterFirstRun = hashJsFiles(schemaFiles);

        runGenerator();

        const hashesAfterSecondRun = hashJsFiles(schemaFiles);

        expect(hashesAfterSecondRun.size).to.equal(hashesAfterFirstRun.size);

        const changedFiles = [];
        for (const [relativePath, firstHash] of hashesAfterFirstRun) {
            const secondHash = hashesAfterSecondRun.get(relativePath);
            if (secondHash !== firstHash) {
                changedFiles.push(relativePath);
            }
        }

        expect(
            changedFiles,
            `non-idempotent schema files: ${changedFiles.join(", ")}`
        ).to.deep.equal([]);
    });

    it("spot-checks temporal canonical validators in generated schemas", function () {
        const dateSchema = fs.readFileSync(
            path.join(GENERATED_SCHEMA_DIR, "date.js"),
            "utf8"
        );
        const extensionSchema = fs.readFileSync(
            path.join(GENERATED_SCHEMA_DIR, "Extension.js"),
            "utf8"
        );

        expect(dateSchema).to.include("validateCanonicalDate");
        expect(extensionSchema).to.match(/valueDate:\s*date/);
    });
});
