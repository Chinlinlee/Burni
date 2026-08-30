const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { computeFileChecksum, getBundlePath } = require("../../migration/provenance");

const CHECKSUM_ALGORITHM = "sha256";
const BUILD_ARTIFACTS_COMMAND = "npm run search-parameter:build-artifacts";

const COMPILER_DIR = path.join(__dirname, "../../compiler");
const TYPE_MAPS_DIR = path.join(
    __dirname,
    "../../../../../api_generator/to-code-use-definition"
);

/**
 * @typedef {Object} ArtifactIdentity
 * @property {string} bundleChecksum
 * @property {string} compilerDirectoryHash
 * @property {string} typeMapsDirectoryHash
 * @property {string} [bodyChecksum]
 */

/**
 * @typedef {Object} ArtifactIdentityVerificationResult
 * @property {boolean} valid
 * @property {string[]} errors
 */

/**
 * @param {string} directoryPath
 * @returns {string[]}
 */
function listRelativeFilePaths(directoryPath) {
    /** @type {string[]} */
    const relativePaths = [];

    /**
     * @param {string} currentDirectory
     * @param {string} prefix
     */
    function walk(currentDirectory, prefix) {
        for (const entry of fs.readdirSync(currentDirectory, { withFileTypes: true })) {
            const relativePath = prefix ? path.join(prefix, entry.name) : entry.name;
            const absolutePath = path.join(currentDirectory, entry.name);
            if (entry.isDirectory()) {
                walk(absolutePath, relativePath);
                continue;
            }
            if (!entry.isFile()) {
                continue;
            }
            relativePaths.push(relativePath);
        }
    }

    walk(directoryPath, "");
    return relativePaths.sort((left, right) => left.localeCompare(right));
}

/**
 * @param {string} directoryPath
 * @returns {string}
 */
function computeDirectoryHash(directoryPath) {
    if (!fs.existsSync(directoryPath)) {
        throw new Error(`Directory not found for artifact identity: ${directoryPath}`);
    }

    const hash = crypto.createHash(CHECKSUM_ALGORITHM);
    for (const relativePath of listRelativeFilePaths(directoryPath)) {
        const normalizedPath = relativePath.split(path.sep).join("/");
        const fileHash = computeFileChecksum(path.join(directoryPath, relativePath));
        hash.update(normalizedPath);
        hash.update("\0");
        hash.update(fileHash);
        hash.update("\0");
    }
    return hash.digest("hex");
}

/**
 * @param {Object} [options]
 * @param {string} [options.bodyChecksum]
 * @returns {ArtifactIdentity}
 */
function computeCurrentIdentity(options = {}) {
    /** @type {ArtifactIdentity} */
    const identity = {
        bundleChecksum: computeFileChecksum(getBundlePath()),
        compilerDirectoryHash: computeDirectoryHash(COMPILER_DIR),
        typeMapsDirectoryHash: computeDirectoryHash(TYPE_MAPS_DIR)
    };

    if (options.bodyChecksum !== undefined) {
        identity.bodyChecksum = options.bodyChecksum;
    }

    return identity;
}

/**
 * @param {Object} body
 * @returns {string}
 */
function computeBodyChecksum(body) {
    return crypto.createHash(CHECKSUM_ALGORITHM).update(JSON.stringify(body)).digest("hex");
}

/**
 * @param {import('./compiledArtifact').CompiledBuiltinArtifact} artifact
 * @returns {Object}
 */
function extractArtifactBody(artifact) {
    const { header, ...body } = artifact;
    void header;
    return body;
}

/**
 * @param {import('./compiledArtifact').CompiledBuiltinArtifact | null | undefined} artifact
 * @returns {ArtifactIdentityVerificationResult}
 */
function verifyArtifactIdentity(artifact) {
    const errors = [];

    if (!artifact || typeof artifact !== "object") {
        errors.push(
            `SearchParameter compile artifact is missing. Run ${BUILD_ARTIFACTS_COMMAND} to generate it.`
        );
        return { valid: false, errors };
    }

    const expectedIdentity = artifact.header?.identity;
    if (!expectedIdentity) {
        errors.push(
            `SearchParameter compile artifact is missing identity metadata. Run ${BUILD_ARTIFACTS_COMMAND} to regenerate it.`
        );
        return { valid: false, errors };
    }

    const body = extractArtifactBody(artifact);
    const actualBodyChecksum = computeBodyChecksum(body);
    if (
        !expectedIdentity.bodyChecksum ||
        expectedIdentity.bodyChecksum !== actualBodyChecksum
    ) {
        errors.push(
            `SearchParameter compile artifact body checksum mismatch. Run ${BUILD_ARTIFACTS_COMMAND} to regenerate it.`
        );
    }

    const currentIdentity = computeCurrentIdentity();
    if (
        !expectedIdentity.bundleChecksum ||
        expectedIdentity.bundleChecksum !== currentIdentity.bundleChecksum
    ) {
        errors.push(
            `SearchParameter bundle checksum mismatch. Run ${BUILD_ARTIFACTS_COMMAND} to regenerate the compile artifact.`
        );
    }
    if (
        !expectedIdentity.compilerDirectoryHash ||
        expectedIdentity.compilerDirectoryHash !== currentIdentity.compilerDirectoryHash
    ) {
        errors.push(
            `SearchParameter compiler directory hash mismatch. Run ${BUILD_ARTIFACTS_COMMAND} to regenerate the compile artifact.`
        );
    }
    if (
        !expectedIdentity.typeMapsDirectoryHash ||
        expectedIdentity.typeMapsDirectoryHash !== currentIdentity.typeMapsDirectoryHash
    ) {
        errors.push(
            `SearchParameter type maps directory hash mismatch. Run ${BUILD_ARTIFACTS_COMMAND} to regenerate the compile artifact.`
        );
    }

    return { valid: errors.length === 0, errors };
}

module.exports = {
    CHECKSUM_ALGORITHM,
    BUILD_ARTIFACTS_COMMAND,
    COMPILER_DIR,
    TYPE_MAPS_DIR,
    computeDirectoryHash,
    computeCurrentIdentity,
    computeBodyChecksum,
    extractArtifactBody,
    verifyArtifactIdentity
};
