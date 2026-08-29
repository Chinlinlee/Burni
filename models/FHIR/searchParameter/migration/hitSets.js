const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const HIT_SETS_ARTIFACT = path.join(__dirname, "artifacts/hit-sets.json");

/** @type {Record<string, Array<{ code: string, query: Record<string, string>, expectHit: "main" | "companion" | "none" }>>} */
const KNOWN_HIT_SETS = {
    Patient: [
        { code: "active", query: { active: "true" }, expectHit: "main" },
        { code: "address", query: { address: "Amsterdam" }, expectHit: "main" },
        { code: "address-city", query: { "address-city": "Amsterdam" }, expectHit: "main" },
        { code: "address-country", query: { "address-country": "NLD" }, expectHit: "main" },
        { code: "address-postalcode", query: { "address-postalcode": "1055RW" }, expectHit: "main" },
        { code: "address-state", query: { "address-state": "ZH" }, expectHit: "companion" },
        { code: "address-use", query: { "address-use": "home" }, expectHit: "main" },
        { code: "birthdate", query: { birthdate: "1960-03-13" }, expectHit: "main" },
        { code: "death-date", query: { "death-date": "2020-01-15" }, expectHit: "companion" },
        { code: "deceased", query: { deceased: "false" }, expectHit: "main" },
        { code: "email", query: { email: "roel.bor@example.org" }, expectHit: "main" },
        { code: "family", query: { family: "Bor" }, expectHit: "main" },
        { code: "gender", query: { gender: "male" }, expectHit: "main" },
        {
            code: "general-practitioner",
            query: { "general-practitioner": "Practitioner/gp-example" },
            expectHit: "main"
        },
        { code: "given", query: { given: "Roelof" }, expectHit: "main" },
        {
            code: "identifier",
            query: { identifier: "urn:oid:2.16.840.1.113883.2.4.6.3|123456789" },
            expectHit: "main"
        },
        { code: "language", query: { language: "nl-NL" }, expectHit: "main" },
        { code: "link", query: { link: "Patient/link-target" }, expectHit: "main" },
        { code: "name", query: { name: "Roel" }, expectHit: "main" },
        { code: "organization", query: { organization: "Organization/f201" }, expectHit: "main" },
        { code: "phone", query: { phone: "+31612345678" }, expectHit: "main" },
        { code: "phonetic", query: { phonetic: "Bor" }, expectHit: "main" },
        { code: "telecom", query: { telecom: "+31201234567" }, expectHit: "main" }
    ]
};

/** @type {Object | null} */
let cachedArtifact = null;

/**
 * @returns {Object}
 */
function loadHitSetArtifact() {
    if (cachedArtifact) {
        return cachedArtifact;
    }
    if (!fs.existsSync(HIT_SETS_ARTIFACT)) {
        cachedArtifact = { version: 1, resources: {}, summary: { definedHitSets: 0 } };
        return cachedArtifact;
    }
    cachedArtifact = JSON.parse(fs.readFileSync(HIT_SETS_ARTIFACT, "utf8"));
    return cachedArtifact;
}

/**
 * @param {Object} hitSet
 * @returns {string}
 */
function hashHitSet(hitSet) {
    return crypto.createHash("sha256").update(JSON.stringify(hitSet)).digest("hex");
}

/**
 * @param {string} resourceType
 * @param {string} code
 * @returns {Object | null}
 */
function getKnownHitSet(resourceType, code) {
    const curated = (KNOWN_HIT_SETS[resourceType] || []).find((entry) => entry.code === code);
    if (curated) {
        return {
            status: "defined",
            hash: hashHitSet(curated),
            positive: {
                query: curated.query,
                expectDocument: curated.expectHit
            },
            companionNegative: {
                expectDocument: curated.expectHit === "main" ? "companion" : "main"
            },
            missing: {
                applicable: true
            }
        };
    }

    const artifact = loadHitSetArtifact();
    const hitSet = artifact.resources?.[resourceType]?.[code];
    if (!hitSet || hitSet.status !== "defined") {
        return null;
    }
    return hitSet;
}

/**
 * @returns {Object}
 */
function getHitSetSummary() {
    const artifact = loadHitSetArtifact();
    return artifact.summary || { definedHitSets: 0, pendingHitSets: 0, compiledLookups: 0 };
}

module.exports = {
    HIT_SETS_ARTIFACT,
    KNOWN_HIT_SETS,
    loadHitSetArtifact,
    getKnownHitSet,
    getHitSetSummary,
    hashHitSet
};
