const fs = require("fs");
const path = require("path");
const { verifyProvenance, computeFileChecksum, getBundlePath } = require("./provenance");
const { computeFileHash } = require("./fixtureMapping");

/**
 * @typedef {Object} ManifestDriftResult
 * @property {boolean} valid
 * @property {string[]} errors
 */

/**
 * @param {Object} committed
 * @param {Object} current
 * @returns {ManifestDriftResult}
 */
function verifyManifestDrift(committed, current) {
    const errors = [];

    if (committed.source?.bundleChecksum !== current.source?.bundleChecksum) {
        errors.push("Bundle checksum drift detected");
    }
    if (committed.source?.provenanceChecksum !== current.source?.provenanceChecksum) {
        errors.push("Provenance checksum drift detected");
    }
    if (committed.manifestHash !== current.manifestHash) {
        errors.push("Migration manifest body drift detected");
    }

    for (const resourceType of Object.keys(current.resources || {})) {
        const committedResource = committed.resources?.[resourceType];
        const currentResource = current.resources[resourceType];
        if (!committedResource) {
            errors.push(`Missing committed manifest resource: ${resourceType}`);
            continue;
        }

        const committedFixtureHash = committedResource.fixture?.activeFixtureHash;
        const currentFixtureHash = currentResource.fixture?.activeFixtureHash;
        if (committedFixtureHash && currentFixtureHash && committedFixtureHash !== currentFixtureHash) {
            errors.push(`Fixture hash drift for ${resourceType}`);
        }

        for (const [code, lookup] of Object.entries(currentResource.lookups || {})) {
            const committedLookup = committedResource.lookups?.[code];
            if (!committedLookup) {
                errors.push(`Missing committed lookup manifest entry: ${resourceType}::${code}`);
                continue;
            }

            if (lookup.planHash && committedLookup.planHash && lookup.planHash !== committedLookup.planHash) {
                errors.push(`Plan hash drift for ${resourceType}::${code}`);
            }

            const committedHitHash = committedLookup.hitSet?.hash;
            const currentHitHash = lookup.hitSet?.hash;
            if (
                committedHitHash &&
                currentHitHash &&
                committedHitHash !== currentHitHash
            ) {
                errors.push(`Hit-set hash drift for ${resourceType}::${code}`);
            }
        }
    }

    return { valid: errors.length === 0, errors };
}

/**
 * @param {string} manifestPath
 * @param {Object} currentManifest
 * @returns {ManifestDriftResult}
 */
function verifyCommittedManifestDrift(manifestPath, currentManifest) {
    if (!fs.existsSync(manifestPath)) {
        return {
            valid: false,
            errors: [`Committed migration manifest not found: ${manifestPath}`]
        };
    }

    const committed = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    return verifyManifestDrift(committed, currentManifest);
}

/**
 * @param {Object} fixtureArchive
 * @returns {ManifestDriftResult}
 */
function verifyFixtureArchiveDrift(fixtureArchive) {
    const errors = [];

    for (const [resourceType, fixture] of Object.entries(fixtureArchive.resources || {})) {
        const activePath = fixture.activeFixturePath;
        if (!activePath || !fs.existsSync(activePath)) {
            errors.push(`Active fixture file missing for ${resourceType}: ${activePath}`);
            continue;
        }

        const actualHash = computeFileHash(activePath);
        if (fixture.activeFixtureHash !== actualHash) {
            errors.push(`Active fixture hash mismatch for ${resourceType}`);
        }

        if (fixture.official?.archivePath && fs.existsSync(fixture.official.archivePath)) {
            const officialHash = computeFileHash(fixture.official.archivePath);
            if (fixture.official.archiveHash !== officialHash) {
                errors.push(`Official archive hash mismatch for ${resourceType}`);
            }
        }
    }

    return { valid: errors.length === 0, errors };
}

/**
 * @param {Object} input
 * @param {Object} input.currentManifest
 * @param {Object} input.fixtureArchive
 * @param {string} [input.manifestPath]
 * @returns {ManifestDriftResult}
 */
function verifyMigrationArtifacts({ currentManifest, fixtureArchive, manifestPath }) {
    const errors = [];

    const provenance = verifyProvenance();
    if (!provenance.valid) {
        errors.push(...provenance.errors);
    }

    const bundleChecksum = computeFileChecksum(getBundlePath());
    if (currentManifest.source?.bundleChecksum !== bundleChecksum) {
        errors.push("Current manifest bundle checksum does not match fixture bundle");
    }

    const fixtureDrift = verifyFixtureArchiveDrift(fixtureArchive);
    errors.push(...fixtureDrift.errors);

    if (manifestPath) {
        const manifestDrift = verifyCommittedManifestDrift(manifestPath, currentManifest);
        errors.push(...manifestDrift.errors);
    }

    return { valid: errors.length === 0, errors };
}

module.exports = {
    verifyManifestDrift,
    verifyCommittedManifestDrift,
    verifyFixtureArchiveDrift,
    verifyMigrationArtifacts
};
