const fs = require("fs");
const path = require("path");

const FIXTURE_DIR = __dirname;

/**
 * @param {string} fileName
 * @returns {Object}
 */
function loadJsonFixture(fileName) {
    return JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, fileName), "utf8"));
}

/**
 * @param {Object} value
 * @returns {Object}
 */
function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

/**
 * @param {Object} document
 * @param {Record<string, string>} replacements
 * @returns {Object}
 */
function replacePlaceholders(document, replacements) {
    const serialized = JSON.stringify(document);
    let next = serialized;
    for (const [placeholder, replacement] of Object.entries(replacements)) {
        next = next.split(placeholder).join(replacement);
    }
    return JSON.parse(next);
}

/**
 * @param {Object} document
 * @param {string} role
 * @returns {Object}
 */
function withFixtureRole(document, role) {
    return { ...clone(document), _fixtureRole: role };
}

/**
 * @param {{
 *   patientMainId: string,
 *   patientFocusId: string,
 *   groupMainId?: string
 * }} ids
 */
function buildDocumentBundleMain(ids) {
    return withFixtureRole(
        replacePlaceholders(loadJsonFixture("document-bundle-main.json"), {
            "placeholder-patient-main": ids.patientMainId
        }),
        "document-main"
    );
}

/**
 * @param {{ patientMainId: string }} ids
 */
function buildDocumentBundleCompanion(ids) {
    return withFixtureRole(
        replacePlaceholders(loadJsonFixture("document-bundle-companion.json"), {
            "placeholder-patient-main": ids.patientMainId
        }),
        "document-companion"
    );
}

/**
 * @param {{ patientFocusId: string }} ids
 */
function buildMessageBundleMain(ids) {
    return withFixtureRole(
        replacePlaceholders(loadJsonFixture("message-bundle-main.json"), {
            "placeholder-patient-focus": ids.patientFocusId
        }),
        "message-main"
    );
}

/**
 * @param {{ patientFocusId: string }} ids
 */
function buildMessageBundleCompanion(ids) {
    return withFixtureRole(
        replacePlaceholders(loadJsonFixture("message-bundle-companion.json"), {
            "placeholder-patient-focus": ids.patientFocusId
        }),
        "message-companion"
    );
}

/**
 * Composition only in entry[1] must not satisfy inline special search.
 *
 * @param {{ patientMainId: string }} ids
 */
function buildDocumentEntryOneCompositionTrap(ids) {
    const main = buildDocumentBundleMain(ids);
    const compositionEntry = main.entry[0];
    return withFixtureRole(
        {
            ...main,
            entry: [
                {
                    resource: {
                        resourceType: "Patient",
                        id: "entry-zero-patient"
                    }
                },
                compositionEntry
            ]
        },
        "document-entry1-trap"
    );
}

/**
 * Document bundle whose first entry lacks an embedded resource.
 *
 * @param {{ patientMainId: string }} ids
 */
function buildDocumentWrongFirstEntry(ids) {
    const main = buildDocumentBundleMain(ids);
    return withFixtureRole(
        {
            ...main,
            entry: [
                {
                    fullUrl: main.entry[0].fullUrl
                }
            ]
        },
        "document-wrong-first-entry"
    );
}

/**
 * @param {{ groupMainId: string }} ids
 */
function buildDocumentGroupSubject(ids) {
    const bundle = buildDocumentBundleMain({
        patientMainId: "unused-patient",
        patientFocusId: "unused-focus"
    });
    bundle.entry[0].resource.subject = { reference: `Group/${ids.groupMainId}` };
    bundle.entry[0].resource.id = "comp-group";
    bundle.entry[0].fullUrl = "https://example.org/fhir/Composition/comp-group";
    return withFixtureRole(bundle, "document-group-subject");
}

/**
 * @param {{ patientMainId: string, organizationId: string, patientNestedOrgId: string }} ids
 */
function buildDocumentNestedOrganization(ids) {
    const bundle = buildDocumentBundleMain({
        patientMainId: ids.patientNestedOrgId,
        patientFocusId: "unused-focus"
    });
    bundle.entry[0].resource.id = "comp-nested";
    bundle.entry[0].fullUrl = "https://example.org/fhir/Composition/comp-nested";
    return withFixtureRole(bundle, "document-nested-org");
}

/**
 * @returns {Object}
 */
function loadRelatedResourceTemplates() {
    return loadJsonFixture("related-resources.json");
}

/**
 * Positive and companion-negative hit-set definitions for document/message bundles.
 */
const CHAINED_HIT_SETS = {
    compositionPatientName: {
        parameter: "composition.patient.name",
        value: "Roel",
        expectRoles: ["document-main"],
        excludeRoles: [
            "document-companion",
            "document-entry1-trap",
            "document-wrong-first-entry",
            "document-group-subject",
            "document-nested-org",
            "message-main"
        ]
    },
    compositionGroupName: {
        parameter: "composition.patient.name",
        value: "InlineGroupRoel",
        expectRoles: ["document-group-subject"],
        excludeRoles: ["document-main", "document-companion", "document-entry1-trap"]
    },
    messageFocusPatientName: {
        parameter: "message.focus:Patient.name",
        value: "Mila",
        expectRoles: ["message-main"],
        excludeRoles: ["message-companion"]
    },
    compositionNestedOrganizationName: {
        parameter: "composition.patient:Patient.organization.name",
        value: "Acme Health",
        expectRoles: ["document-nested-org"],
        excludeRoles: ["document-main", "document-group-subject"]
    },
    compositionPatientNameExact: {
        parameter: "composition.patient.name:exact",
        value: "Bor",
        expectRoles: ["document-main"],
        excludeRoles: ["document-group-subject", "document-nested-org"]
    }
};

const DIRECT_HIT_SETS = {
    compositionRelative: {
        parameter: "composition",
        valueFrom: (ids) => `Composition/comp-main`,
        expectRoles: ["document-main"],
        excludeRoles: ["document-companion", "document-entry1-trap", "document-wrong-first-entry"]
    },
    compositionBareId: {
        parameter: "composition",
        valueFrom: () => "comp-main",
        expectRoles: ["document-main"],
        excludeRoles: ["document-companion", "document-entry1-trap"]
    },
    compositionFullUrl: {
        parameter: "composition",
        valueFrom: () => "https://example.org/fhir/Composition/comp-main",
        expectRoles: ["document-main"],
        excludeRoles: ["document-companion", "document-entry1-trap"]
    },
    messageRelative: {
        parameter: "message",
        valueFrom: () => "MessageHeader/msg-main",
        expectRoles: ["message-main"],
        excludeRoles: ["message-companion"]
    },
    messageBareId: {
        parameter: "message",
        valueFrom: () => "msg-main",
        expectRoles: ["message-main"],
        excludeRoles: ["message-companion"]
    },
    messageFullUrl: {
        parameter: "message",
        valueFrom: () => "https://example.org/fhir/MessageHeader/msg-main",
        expectRoles: ["message-main"],
        excludeRoles: ["message-companion"]
    }
};

module.exports = {
    CHAINED_HIT_SETS,
    DIRECT_HIT_SETS,
    buildDocumentBundleCompanion,
    buildDocumentBundleMain,
    buildDocumentEntryOneCompositionTrap,
    buildDocumentGroupSubject,
    buildDocumentNestedOrganization,
    buildDocumentWrongFirstEntry,
    buildMessageBundleCompanion,
    buildMessageBundleMain,
    loadRelatedResourceTemplates,
    replacePlaceholders,
    withFixtureRole
};
