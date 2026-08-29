const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const productionResources = require("../../fhir.resourceList.json");
const {
    loadExampleMapping,
    selectOfficialExample,
    indexExampleFiles,
    getOfficialArchivePath
} = require("./fixtureMapping");
const { buildDerivedFixture, buildSyntheticFixture } = require("./fixtureDerivation");
const { COMPANION_DIR, writeCompanionFixture } = require("./companionFixtures");

const ARCHIVE_ROOT = path.join(__dirname, "../../../../test/fixtures/archive");
const OFFICIAL_DIR = path.join(ARCHIVE_ROOT, "official");
const DERIVED_DIR = path.join(ARCHIVE_ROOT, "derived");
const SYNTHETIC_DIR = path.join(ARCHIVE_ROOT, "synthetic");

/**
 * @param {Object} value
 * @returns {string}
 */
function hashValue(value) {
    return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

/**
 * @param {string} dir
 * @param {string} resourceType
 * @param {Object} resource
 * @returns {{ archivePath: string, archiveHash: string }}
 */
function writeArchiveFixture(dir, resourceType, resource) {
    fs.mkdirSync(dir, { recursive: true });
    const archivePath = path.join(dir, `${resourceType}.json`);
    const content = JSON.stringify(resource, null, 2);
    fs.writeFileSync(archivePath, content);
    return {
        archivePath: archivePath.replace(/\\/g, "/"),
        archiveHash: crypto.createHash("sha256").update(content).digest("hex")
    };
}

/**
 * @param {string} resourceType
 * @returns {Object}
 */
function loadOfficialArchiveResource(resourceType) {
    const archivePath = getOfficialArchivePath(resourceType);
    if (!fs.existsSync(archivePath)) {
        throw new Error(
            `Official archive fixture missing for ${resourceType}: ${archivePath}. ` +
                "Run search-parameter:build-artifacts or restore test/fixtures/archive/official."
        );
    }
    return JSON.parse(fs.readFileSync(archivePath, "utf8"));
}

/**
 * @param {Object} input
 * @param {import('../registry/types').RegistrySnapshot} input.snapshot
 * @param {import('../registry/types').SearchParameterDefinition[]} input.definitions
 * @param {Object} [input.exampleMapping]
 * @param {string} [input.examplesDir] 僅在需要從 HL7 examples 重新歸檔 official fixture 時提供
 * @returns {Object}
 */
function buildFixtureArchive({ snapshot, definitions, exampleMapping, examplesDir }) {
    const mapping = exampleMapping || loadExampleMapping();
    const exampleIndex = examplesDir ? indexExampleFiles(examplesDir).byResourceType : null;

    /** @type {Record<string, Object>} */
    const resources = {};
    const summary = {
        official: 0,
        derived: 0,
        synthetic: 0,
        companion: 0
    };

    for (const resourceType of productionResources) {
        const entry = mapping.resources[resourceType];
        const compiledPlans = [];

        for (const [lookupKey, definition] of snapshot.byLookupKey) {
            const [lookupResourceType] = lookupKey.split("::");
            if (lookupResourceType !== resourceType) {
                continue;
            }
            const plan = definition.lookupPlans?.[lookupKey]?.plan || definition.compiledPlan;
            if (plan) {
                compiledPlans.push(plan);
            }
        }

        if (entry.valueSource === "official") {
            let officialResource;
            if (examplesDir) {
                const selected = selectOfficialExample(resourceType, examplesDir, exampleIndex);
                if (!selected) {
                    throw new Error(`Expected official example for ${resourceType} during discovery`);
                }
                officialResource = selected.resource;
            } else {
                officialResource = loadOfficialArchiveResource(resourceType);
            }

            const officialWritten = writeArchiveFixture(OFFICIAL_DIR, resourceType, officialResource);
            summary.official += 1;

            const derived = buildDerivedFixture(resourceType, officialResource, compiledPlans);
            let derivedWritten = null;
            if (derived.needsDerived) {
                derivedWritten = writeArchiveFixture(DERIVED_DIR, resourceType, derived.resource);
                summary.derived += 1;
            }

            const activeResource = derived.needsDerived ? derived.resource : officialResource;
            const companionWritten = writeCompanionFixture(resourceType, activeResource);
            summary.companion += 1;

            resources[resourceType] = {
                valueSource: derived.needsDerived ? "derived" : "official",
                official: {
                    sourceFile: entry.sourceFile,
                    sourceHash: entry.sourceHash,
                    archivePath: path.relative(process.cwd(), officialWritten.archivePath).replace(/\\/g, "/"),
                    archiveHash: officialWritten.archiveHash
                },
                derived: derivedWritten
                    ? {
                          archivePath: path
                              .relative(process.cwd(), derivedWritten.archivePath)
                              .replace(/\\/g, "/"),
                          archiveHash: derivedWritten.archiveHash,
                          augmentations: derived.augmentations
                      }
                    : null,
                companion: {
                    archivePath: path
                        .relative(process.cwd(), companionWritten.archivePath)
                        .replace(/\\/g, "/"),
                    archiveHash: companionWritten.archiveHash
                },
                activeFixturePath: derived.needsDerived
                    ? path.relative(process.cwd(), derivedWritten.archivePath).replace(/\\/g, "/")
                    : path.relative(process.cwd(), officialWritten.archivePath).replace(/\\/g, "/"),
                activeFixtureHash: derived.needsDerived
                    ? derivedWritten.archiveHash
                    : officialWritten.archiveHash
            };
        } else {
            const syntheticResource = buildSyntheticFixture(resourceType);
            const syntheticWritten = writeArchiveFixture(
                SYNTHETIC_DIR,
                resourceType,
                syntheticResource
            );
            summary.synthetic += 1;

            const companionWritten = writeCompanionFixture(resourceType, syntheticResource);
            summary.companion += 1;

            resources[resourceType] = {
                valueSource: "synthetic",
                official: null,
                derived: null,
                synthetic: {
                    archivePath: path
                        .relative(process.cwd(), syntheticWritten.archivePath)
                        .replace(/\\/g, "/"),
                    archiveHash: syntheticWritten.archiveHash,
                    reason: entry.reason
                },
                companion: {
                    archivePath: path
                        .relative(process.cwd(), companionWritten.archivePath)
                        .replace(/\\/g, "/"),
                    archiveHash: companionWritten.archiveHash
                },
                activeFixturePath: path
                    .relative(process.cwd(), syntheticWritten.archivePath)
                    .replace(/\\/g, "/"),
                activeFixtureHash: syntheticWritten.archiveHash
            };
        }
    }

    return {
        generatedAt: new Date().toISOString(),
        archiveRoot: path.relative(process.cwd(), ARCHIVE_ROOT).replace(/\\/g, "/"),
        exampleMapping: mapping,
        resources,
        summary
    };
}

/**
 * @param {string} filePath
 * @returns {string}
 */
function toRelativePath(filePath) {
    return path.relative(process.cwd(), filePath).replace(/\\/g, "/");
}

/**
 * @param {string} filePath
 * @returns {string | null}
 */
function hashExistingFile(filePath) {
    if (!fs.existsSync(filePath)) {
        return null;
    }
    return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

/**
 * 讀取已歸檔 fixture 的 provenance，不重寫檔案。
 * @returns {Record<string, Object>}
 */
function loadFixtureProvenance() {
    const mapping = loadExampleMapping();
    /** @type {Record<string, Object>} */
    const resources = {};

    for (const resourceType of productionResources) {
        const entry = mapping.resources[resourceType];
        const officialPath = path.join(OFFICIAL_DIR, `${resourceType}.json`);
        const derivedPath = path.join(DERIVED_DIR, `${resourceType}.json`);
        const syntheticPath = path.join(SYNTHETIC_DIR, `${resourceType}.json`);
        const companionPath = path.join(COMPANION_DIR, `${resourceType}.json`);

        const officialExists = fs.existsSync(officialPath);
        const derivedExists = fs.existsSync(derivedPath);
        const syntheticExists = fs.existsSync(syntheticPath);
        const companionExists = fs.existsSync(companionPath);

        let valueSource;
        let activePath = null;
        if (entry.valueSource === "synthetic") {
            valueSource = "synthetic";
            activePath = syntheticExists ? syntheticPath : null;
        } else if (derivedExists) {
            valueSource = "derived";
            activePath = derivedPath;
        } else {
            valueSource = "official";
            activePath = officialExists ? officialPath : null;
        }

        resources[resourceType] = {
            valueSource,
            official: officialExists
                ? {
                      sourceFile: entry.sourceFile,
                      sourceHash: entry.sourceHash,
                      archivePath: toRelativePath(officialPath),
                      archiveHash: hashExistingFile(officialPath)
                  }
                : null,
            derived: derivedExists
                ? {
                      archivePath: toRelativePath(derivedPath),
                      archiveHash: hashExistingFile(derivedPath)
                  }
                : null,
            synthetic: syntheticExists
                ? {
                      archivePath: toRelativePath(syntheticPath),
                      archiveHash: hashExistingFile(syntheticPath),
                      reason: entry.reason
                  }
                : null,
            companion: companionExists
                ? {
                      archivePath: toRelativePath(companionPath),
                      archiveHash: hashExistingFile(companionPath)
                  }
                : null,
            activeFixturePath: activePath ? toRelativePath(activePath) : null,
            activeFixtureHash: activePath ? hashExistingFile(activePath) : null
        };
    }

    return resources;
}

module.exports = {
    ARCHIVE_ROOT,
    OFFICIAL_DIR,
    DERIVED_DIR,
    SYNTHETIC_DIR,
    hashValue,
    writeArchiveFixture,
    loadOfficialArchiveResource,
    buildFixtureArchive,
    loadFixtureProvenance
};
