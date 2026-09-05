"use strict";

const compiledArtifact = require("../../FHIR/searchParameter/registry/artifacts/compiledArtifact");
const { applyActivationOverlay } = require("../../FHIR/searchParameter/registry/activationPolicy");
const {
    generateTemporalIndexManifestWithDiagnostics,
    getDefinitionRecords
} = require("../../FHIR/searchParameter/indexes/indexGenerator");
const {
    validateTemporalIndexManifest,
    validateTemporalIndexEntryCompatibility
} = require("../../FHIR/searchParameter/indexes/indexValidation");
const { getIndexIdentity } = require("../../FHIR/searchParameter/indexes/indexManifest");
const { createDerivedIndexContract } = require("./contracts");

/**
 * @returns {{ definitions: import('../../FHIR/searchParameter/registry/types').SearchParameterDefinition[], artifactIdentity: import('../../FHIR/searchParameter/registry/artifacts/artifactIdentity').ArtifactIdentity, diagnostics: import('../../FHIR/searchParameter/registry/diagnostics').RegistryDiagnostic[] }}
 */
function loadApprovedBuiltinDefinitions() {
    const artifact = compiledArtifact.readArtifact();
    const verification = compiledArtifact.verifyArtifactIdentity(artifact);
    if (!verification.valid) {
        throw new Error(verification.errors.join("; "));
    }

    /** @type {import('../../FHIR/searchParameter/registry/types').SearchParameterDefinition[]} */
    const definitions = [];
    /** @type {import('../../FHIR/searchParameter/registry/diagnostics').RegistryDiagnostic[]} */
    const diagnostics = [];

    for (const entry of Object.values(artifact.definitions)) {
        const hydrated = compiledArtifact.hydrateDefinitionEntry(entry);
        diagnostics.push(...(entry.compile.diagnostics || []));
        const activated = applyActivationOverlay(hydrated, {
            compilable: entry.compile.compilable,
            reason: entry.compile.reason
        });
        activated.lookupPlans = entry.compile.lookupPlans;

        if (activated.source !== "builtin-bundle") {
            continue;
        }
        if (activated.effectiveStatus !== "active") {
            continue;
        }
        definitions.push(activated);
    }

    return {
        definitions,
        artifactIdentity: artifact.header.identity,
        diagnostics
    };
}

/**
 * @param {unknown} diagnostic
 * @returns {string}
 */
function serializeDiagnostic(diagnostic) {
    if (typeof diagnostic === "string") {
        return diagnostic;
    }
    if (diagnostic && typeof diagnostic === "object") {
        const record = diagnostic;
        const code = record.code || "diagnostic";
        const message = record.message || JSON.stringify(record);
        const lookupKey = record.lookupKey ? ` lookup=${record.lookupKey}` : "";
        const path = record.path || record.extractionPath;
        const pathSuffix = path ? ` path=${path}` : "";
        return `${code}: ${message}${lookupKey}${pathSuffix}`;
    }
    return String(diagnostic);
}

/**
 * @param {Object} [options]
 * @returns {{ entries: import('../../FHIR/searchParameter/indexes/indexManifest').TemporalIndexEntry[], artifactIdentity: import('../../FHIR/searchParameter/registry/artifacts/artifactIdentity').ArtifactIdentity, diagnostics: string[], manifestValidation: { valid: boolean, errors: string[] } }}
 */
function collectApprovedTemporalDerivedIndexes(options = {}) {
    const builtin = loadApprovedBuiltinDefinitions();
    const generated = generateTemporalIndexManifestWithDiagnostics(builtin.definitions);
    const planRecords = getDefinitionRecords(builtin.definitions).filter(
        (record) => record.plan
    );
    const manifestValidation = validateTemporalIndexManifest(generated.manifest, {
        requirePlans: options.requirePlans !== false,
        plans: planRecords
    });

    /** @type {import('../../FHIR/searchParameter/indexes/indexManifest').TemporalIndexEntry[]} */
    const entries = [];
    /** @type {string[]} */
    const diagnostics = [
        ...builtin.diagnostics.map(serializeDiagnostic),
        ...generated.diagnostics.map(serializeDiagnostic),
        ...manifestValidation.errors
    ];

    for (const entry of generated.manifest.indexes) {
        const compatibility = validateTemporalIndexEntryCompatibility(entry);
        if (!compatibility.valid) {
            diagnostics.push(...compatibility.diagnostics.map(serializeDiagnostic));
            continue;
        }
        entries.push(entry);
    }

    diagnostics.sort((left, right) => left.localeCompare(right));

    return {
        entries,
        artifactIdentity: builtin.artifactIdentity,
        diagnostics,
        manifestValidation
    };
}

/**
 * @param {import('../../FHIR/searchParameter/indexes/indexManifest').TemporalIndexEntry} entry
 * @returns {import('./types').DerivedIndexContract}
 */
function temporalEntryToDerivedIndex(entry) {
    return createDerivedIndexContract({
        collection: entry.resourceType,
        key: entry.key,
        options: {
            background: true
        },
        name: entry.name,
        identity: getIndexIdentity(entry),
        temporal: {
            resourceType: entry.resourceType,
            extractionPath: entry.extractionPath,
            datatype: entry.datatype,
            indexKind: entry.indexKind,
            bsonType: entry.bsonType,
            valueShape: entry.valueShape,
            lookupKeys: [...(entry.sources?.lookupKeys || [])].sort((left, right) =>
                left.localeCompare(right)
            ),
            canonicalKeys: [...(entry.sources?.canonicalKeys || [])].sort((left, right) =>
                left.localeCompare(right)
            )
        }
    });
}

/**
 * @param {import('./types').DerivedIndexContract[]} indexes
 * @returns {import('./types').DerivedIndexContract[]}
 */
function sortDerivedIndexes(indexes) {
    return [...indexes].sort((left, right) => left.identity.localeCompare(right.identity));
}

module.exports = {
    loadApprovedBuiltinDefinitions,
    collectApprovedTemporalDerivedIndexes,
    temporalEntryToDerivedIndex,
    sortDerivedIndexes
};
