const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const productionResources = require("../../fhir.resourceList.json");

const ARTIFACTS_DIR = path.join(__dirname, "artifacts");
const EXAMPLE_MAPPING_PATH = path.join(ARTIFACTS_DIR, "example-mapping.json");
const OFFICIAL_ARCHIVE_DIR = path.join(__dirname, "../../../../test/fixtures/archive/official");

const FIXED_EXAMPLE_OVERRIDES = {
    Patient: "patient-example-f201-roel.json"
};

const EXCLUDED_SUFFIXES = [".profile.json", "-questionnaire.json"];

/**
 * @param {string} fileName
 * @returns {boolean}
 */
function isCandidateExampleFile(fileName) {
    if (!fileName.endsWith(".json")) {
        return false;
    }
    return !EXCLUDED_SUFFIXES.some((suffix) => fileName.endsWith(suffix));
}

/**
 * @param {string} filePath
 * @returns {string}
 */
function computeFileHash(filePath) {
    const content = fs.readFileSync(filePath);
    return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * @param {string} resourceType
 * @returns {string}
 */
function getOfficialArchivePath(resourceType) {
    return path.join(OFFICIAL_ARCHIVE_DIR, `${resourceType}.json`);
}

/**
 * @param {string} resourceType
 * @returns {string}
 */
function getOfficialArchiveRelativePath(resourceType) {
    return path.relative(process.cwd(), getOfficialArchivePath(resourceType)).replace(/\\/g, "/");
}

/**
 * @param {string} examplesDir
 * @returns {{ byResourceType: Map<string, string[]>, totalCandidateFiles: number }}
 */
function indexExampleFiles(examplesDir) {
    /** @type {Map<string, string[]>} */
    const byResourceType = new Map();
    let totalCandidateFiles = 0;

    if (!fs.existsSync(examplesDir)) {
        return { byResourceType, totalCandidateFiles };
    }

    for (const fileName of fs.readdirSync(examplesDir)) {
        if (!isCandidateExampleFile(fileName)) {
            continue;
        }
        const filePath = path.join(examplesDir, fileName);
        try {
            const resource = JSON.parse(fs.readFileSync(filePath, "utf8"));
            if (!resource.resourceType) {
                continue;
            }
            totalCandidateFiles += 1;
            if (!byResourceType.has(resource.resourceType)) {
                byResourceType.set(resource.resourceType, []);
            }
            byResourceType.get(resource.resourceType).push(fileName);
        } catch {
            // skip invalid json
        }
    }

    for (const fileNames of byResourceType.values()) {
        fileNames.sort((a, b) => a.localeCompare(b));
    }

    return { byResourceType, totalCandidateFiles };
}

/**
 * @param {string} resourceType
 * @param {string} examplesDir
 * @param {Map<string, string[]>} index
 * @returns {{ fileName: string, filePath: string, sourceHash: string, resource: Object } | null}
 */
function selectOfficialExample(resourceType, examplesDir, index) {
    const override = FIXED_EXAMPLE_OVERRIDES[resourceType];
    if (override) {
        const overridePath = path.join(examplesDir, override);
        if (fs.existsSync(overridePath)) {
            const resource = JSON.parse(fs.readFileSync(overridePath, "utf8"));
            if (resource.resourceType === resourceType) {
                return {
                    fileName: override,
                    filePath: overridePath,
                    sourceHash: computeFileHash(overridePath),
                    resource
                };
            }
        }
    }

    const primaryName = `${resourceType.toLowerCase()}-example.json`;
    const primaryPath = path.join(examplesDir, primaryName);
    if (fs.existsSync(primaryPath)) {
        const resource = JSON.parse(fs.readFileSync(primaryPath, "utf8"));
        if (resource.resourceType === resourceType) {
            return {
                fileName: primaryName,
                filePath: primaryPath,
                sourceHash: computeFileHash(primaryPath),
                resource
            };
        }
    }

    const candidates = index.get(resourceType) || [];
    for (const fileName of candidates) {
        const filePath = path.join(examplesDir, fileName);
        const resource = JSON.parse(fs.readFileSync(filePath, "utf8"));
        if (resource.resourceType === resourceType) {
            return {
                fileName,
                filePath,
                sourceHash: computeFileHash(filePath),
                resource
            };
        }
    }

    return null;
}

/**
 * 一次性從 HL7 examples 目錄掃描候選檔並產生 example mapping。
 * 結果應寫入 artifacts/example-mapping.json；runtime 使用 loadExampleMapping()。
 *
 * @param {string} examplesDir
 * @returns {Object}
 */
function discoverExampleMapping(examplesDir) {
    if (!fs.existsSync(examplesDir)) {
        throw new Error(
            `FHIR examples discovery directory not found: ${examplesDir}. ` +
                "Provide an HL7 examples directory via CLI argument or FHIR_EXAMPLES_DIR, " +
                "then commit artifacts/example-mapping.json."
        );
    }

    const { byResourceType, totalCandidateFiles } = indexExampleFiles(examplesDir);
    /** @type {Record<string, string[]>} */
    const candidateIndex = {};
    for (const [resourceType, fileNames] of byResourceType.entries()) {
        candidateIndex[resourceType] = fileNames;
    }

    /** @type {Record<string, Object>} */
    const resources = {};
    const summary = {
        official: 0,
        missing: 0
    };

    for (const resourceType of productionResources) {
        const candidates = byResourceType.get(resourceType) || [];
        const selected = selectOfficialExample(resourceType, examplesDir, byResourceType);

        if (selected) {
            summary.official += 1;
            resources[resourceType] = {
                resourceType,
                valueSource: "official",
                sourceFile: selected.fileName,
                archivePath: getOfficialArchiveRelativePath(resourceType),
                sourceHash: selected.sourceHash,
                verifiedResourceType: selected.resource.resourceType,
                candidates
            };
        } else {
            summary.missing += 1;
            resources[resourceType] = {
                resourceType,
                valueSource: "synthetic",
                sourceFile: null,
                archivePath: null,
                sourceHash: null,
                verifiedResourceType: null,
                candidates,
                reason: "No official example with matching resourceType"
            };
        }
    }

    return {
        generatedAt: new Date().toISOString(),
        discoverySource: path.relative(process.cwd(), examplesDir).replace(/\\/g, "/"),
        resourceCount: productionResources.length,
        candidateIndex,
        totalCandidateFiles,
        resources,
        summary
    };
}

/**
 * @returns {Object}
 */
function loadExampleMapping() {
    if (!fs.existsSync(EXAMPLE_MAPPING_PATH)) {
        throw new Error(
            `Committed example mapping not found: ${EXAMPLE_MAPPING_PATH}. ` +
                "Run: node models/FHIR/searchParameter/migration/fixtureMapping.js"
        );
    }
    return JSON.parse(fs.readFileSync(EXAMPLE_MAPPING_PATH, "utf8"));
}

/**
 * @param {Object} mapping
 * @returns {string}
 */
function writeExampleMapping(mapping) {
    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
    fs.writeFileSync(EXAMPLE_MAPPING_PATH, JSON.stringify(mapping, null, 2));
    return EXAMPLE_MAPPING_PATH;
}

if (require.main === module) {
    const examplesDir = process.argv[2] || process.env.FHIR_EXAMPLES_DIR;
    if (!examplesDir) {
        console.error(
            "Usage: node fixtureMapping.js <hl7-examples-dir>\n" +
                "  or set FHIR_EXAMPLES_DIR to an HL7 FHIR examples directory."
        );
        process.exit(1);
    }
    try {
        const mapping = discoverExampleMapping(examplesDir);
        const outputPath = writeExampleMapping(mapping);
        console.log(`Wrote example mapping to ${outputPath}`);
        console.log(`  Discovery source: ${mapping.discoverySource}`);
        console.log(`  Candidate files: ${mapping.totalCandidateFiles}`);
        console.log(`  Official mapped: ${mapping.summary.official}`);
        console.log(`  Synthetic required: ${mapping.summary.missing}`);
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}

module.exports = {
    ARTIFACTS_DIR,
    EXAMPLE_MAPPING_PATH,
    OFFICIAL_ARCHIVE_DIR,
    FIXED_EXAMPLE_OVERRIDES,
    computeFileHash,
    indexExampleFiles,
    selectOfficialExample,
    getOfficialArchivePath,
    getOfficialArchiveRelativePath,
    discoverExampleMapping,
    loadExampleMapping,
    writeExampleMapping
};
