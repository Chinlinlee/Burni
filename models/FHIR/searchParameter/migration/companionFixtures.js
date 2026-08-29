const fs = require("fs");
const path = require("path");

const COMPANION_DIR = path.join(__dirname, "../fixtures/archive/companion");

/** @type {Record<string, (mainFixture: Object) => Object>} */
const SPECIAL_COMPANION_BUILDERS = {
    Patient() {
        return {
            resourceType: "Patient",
            active: false,
            gender: "female",
            birthDate: "1985-06-01",
            deceasedDateTime: "2020-01-15",
            name: [{ family: "Companion", given: ["Alex"], text: "Alex Companion" }],
            address: [
                {
                    city: "Rotterdam",
                    country: "USA",
                    postalCode: "3011AA",
                    state: "ZH",
                    use: "work",
                    text: "Rotterdam office"
                }
            ],
            identifier: [{ system: "urn:oid:example", value: "999999999" }],
            communication: [
                {
                    language: {
                        coding: [{ system: "urn:ietf:bcp:47", code: "en-US", display: "English" }]
                    },
                    preferred: true
                }
            ],
            managingOrganization: { reference: "Organization/other-org", display: "Other Org" },
            telecom: [{ system: "phone", value: "+31000000000", use: "mobile" }]
        };
    }
};

/**
 * @param {string} resourceType
 * @param {Object} mainFixture
 * @returns {Object}
 */
function buildCompanionFixture(resourceType, mainFixture) {
    if (SPECIAL_COMPANION_BUILDERS[resourceType]) {
        return SPECIAL_COMPANION_BUILDERS[resourceType](mainFixture);
    }

    return {
        resourceType,
        meta: {
            tag: [
                {
                    system: "urn:burni:fixture-source",
                    code: "companion-negative"
                }
            ]
        },
        ...(mainFixture?.status === "active" ? { status: "inactive" } : {}),
        ...(mainFixture?.gender ? { gender: mainFixture.gender === "male" ? "female" : "male" } : {})
    };
}

/**
 * @param {string} resourceType
 * @param {Object} mainFixture
 * @returns {{ archivePath: string, archiveHash: string, resource: Object }}
 */
function writeCompanionFixture(resourceType, mainFixture) {
    const resource = buildCompanionFixture(resourceType, mainFixture);
    fs.mkdirSync(COMPANION_DIR, { recursive: true });
    const archivePath = path.join(COMPANION_DIR, `${resourceType}.json`);
    const content = JSON.stringify(resource, null, 2);
    fs.writeFileSync(archivePath, content);
    const crypto = require("crypto");
    return {
        archivePath: archivePath.replace(/\\/g, "/"),
        archiveHash: crypto.createHash("sha256").update(content).digest("hex"),
        resource
    };
}

/**
 * @param {string} resourceType
 * @returns {Object | null}
 */
function loadCompanionFixture(resourceType) {
    const archivePath = path.join(COMPANION_DIR, `${resourceType}.json`);
    if (!fs.existsSync(archivePath)) {
        return null;
    }
    return JSON.parse(fs.readFileSync(archivePath, "utf8"));
}

module.exports = {
    COMPANION_DIR,
    buildCompanionFixture,
    writeCompanionFixture,
    loadCompanionFixture
};
