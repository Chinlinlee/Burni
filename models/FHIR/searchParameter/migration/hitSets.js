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

/**
 * @param {string} resourceType
 * @param {string} code
 * @returns {Object | null}
 */
function getKnownHitSet(resourceType, code) {
    const cases = KNOWN_HIT_SETS[resourceType] || [];
    const match = cases.find((entry) => entry.code === code);
    if (!match) {
        return null;
    }

    return {
        status: "defined",
        hash: hashHitSet(match),
        positive: {
            query: match.query,
            expectDocument: match.expectHit
        },
        companionNegative: {
            expectDocument: match.expectHit === "main" ? "companion" : "main"
        }
    };
}

/**
 * @param {Object} hitSet
 * @returns {string}
 */
function hashHitSet(hitSet) {
    const crypto = require("crypto");
    return crypto.createHash("sha256").update(JSON.stringify(hitSet)).digest("hex");
}

module.exports = {
    KNOWN_HIT_SETS,
    getKnownHitSet,
    hashHitSet
};
