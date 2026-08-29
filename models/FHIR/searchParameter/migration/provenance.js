const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const FIXTURES_DIR = path.join(__dirname, "../fixtures");
const PROVENANCE_PATH = path.join(FIXTURES_DIR, "provenance.json");

/**
 * @typedef {Object} SearchParameterProvenance
 * @property {string} fhirVersion
 * @property {string} source
 * @property {string} sourceUrl
 * @property {string} bundleId
 * @property {string} bundleType
 * @property {string} fixtureFile
 * @property {number} definitionCount
 * @property {string} checksumAlgorithm
 * @property {string} checksum
 * @property {string} fetchedAt
 * @property {boolean} trusted
 * @property {string} [notes]
 */

/**
 * @returns {SearchParameterProvenance}
 */
function loadProvenance() {
    const raw = fs.readFileSync(PROVENANCE_PATH, "utf8");
    return JSON.parse(raw);
}

/**
 * @param {string} filePath
 * @returns {string}
 */
function computeFileChecksum(filePath) {
    const content = fs.readFileSync(filePath);
    return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * @param {SearchParameterProvenance} [provenance]
 * @returns {{ valid: boolean, errors: string[], provenance: SearchParameterProvenance }}
 */
function verifyProvenance(provenance = loadProvenance()) {
    const errors = [];
    const bundlePath = path.join(FIXTURES_DIR, provenance.fixtureFile);

    if (!fs.existsSync(bundlePath)) {
        errors.push(`Bundle fixture not found: ${provenance.fixtureFile}`);
        return { valid: false, errors, provenance };
    }

    const actualChecksum = computeFileChecksum(bundlePath);
    if (provenance.checksum && actualChecksum !== provenance.checksum) {
        errors.push(
            `Bundle checksum mismatch: expected ${provenance.checksum}, got ${actualChecksum}`
        );
    }

    const bundle = JSON.parse(fs.readFileSync(bundlePath, "utf8"));
    const entryCount = Array.isArray(bundle.entry) ? bundle.entry.length : 0;
    if (provenance.definitionCount && entryCount !== provenance.definitionCount) {
        errors.push(
            `Definition count mismatch: expected ${provenance.definitionCount}, got ${entryCount}`
        );
    }

    if (!provenance.fhirVersion) {
        errors.push("Missing fhirVersion in provenance");
    }
    if (!provenance.sourceUrl) {
        errors.push("Missing sourceUrl in provenance");
    }
    if (!provenance.fetchedAt) {
        errors.push("Missing fetchedAt in provenance");
    }

    return { valid: errors.length === 0, errors, provenance };
}

/**
 * @returns {string}
 */
function getBundlePath() {
    const provenance = loadProvenance();
    return path.join(FIXTURES_DIR, provenance.fixtureFile);
}

module.exports = {
    FIXTURES_DIR,
    PROVENANCE_PATH,
    loadProvenance,
    computeFileChecksum,
    verifyProvenance,
    getBundlePath
};
