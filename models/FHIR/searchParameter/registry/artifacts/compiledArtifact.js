const fs = require("fs");
const path = require("path");
const {
    CHECKSUM_ALGORITHM,
    BUILD_ARTIFACTS_COMMAND,
    computeCurrentIdentity,
    computeBodyChecksum,
    verifyArtifactIdentity
} = require("./artifactIdentity");

const ARTIFACT_PATH = path.join(__dirname, "compiled-builtin-definitions.json");

/**
 * @typedef {Object} CompiledArtifactHeader
 * @property {number} version
 * @property {string} generatedAt
 * @property {string} checksumAlgorithm
 * @property {import('./artifactIdentity').ArtifactIdentity} identity
 */

/**
 * @typedef {Object} CompiledArtifactDefinitionEntry
 * @property {import('../types').SearchParameterResource} resource
 * @property {'builtin-bundle'} source
 * @property {string} canonicalKey
 * @property {string[]} lookupKeys
 * @property {string} rawStatus
 * @property {CompiledArtifactCompileOutput} compile
 */

/**
 * @typedef {Object} CompiledArtifactCompileOutput
 * @property {boolean} compilable
 * @property {string} [reason]
 * @property {Record<string, import('../../compiler/compiler').LookupCompileResult>} lookupPlans
 * @property {import('../diagnostics').RegistryDiagnostic[]} diagnostics
 */

/**
 * @typedef {Object} CompiledBuiltinArtifact
 * @property {CompiledArtifactHeader} header
 * @property {Record<string, CompiledArtifactDefinitionEntry>} definitions
 */

/**
 * @param {Record<string, unknown>} value
 * @returns {Record<string, unknown>}
 */
function sortRecordKeys(value) {
    return Object.fromEntries(
        Object.keys(value)
            .sort((left, right) => left.localeCompare(right))
            .map((key) => [key, value[key]])
    );
}

/**
 * @param {import('../../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @returns {Omit<import('../../compiler/searchQueryPlan').SearchQueryPlan, 'ast'>}
 */
function sanitizePlan(plan) {
    const { ast, ...rest } = plan;
    void ast;
    return rest;
}

/**
 * @param {Record<string, import('../../compiler/compiler').LookupCompileResult>} [lookupPlans]
 * @returns {Record<string, import('../../compiler/compiler').LookupCompileResult> | undefined}
 */
function sanitizeLookupPlans(lookupPlans) {
    if (!lookupPlans) {
        return undefined;
    }

    /** @type {Record<string, import('../../compiler/compiler').LookupCompileResult>} */
    const sanitized = {};
    for (const [lookupKey, entry] of Object.entries(lookupPlans)) {
        sanitized[lookupKey] = {
            compilable: entry.compilable,
            ...(entry.reason ? { reason: entry.reason } : {}),
            ...(entry.plan ? { plan: sanitizePlan(entry.plan) } : {})
        };
    }
    return sanitized;
}

/**
 * @param {import('../types').SearchParameterDefinition} definition
 * @param {ReturnType<import('../../compiler/compiler').compileDefinition>} compileResult
 * @returns {CompiledArtifactDefinitionEntry}
 */
function serializeDefinitionEntry(definition, compileResult) {
    return {
        resource: definition.resource,
        source: "builtin-bundle",
        canonicalKey: definition.canonicalKey,
        lookupKeys: definition.lookupKeys,
        rawStatus: definition.rawStatus,
        compile: {
            compilable: compileResult.compilable,
            ...(compileResult.reason ? { reason: compileResult.reason } : {}),
            lookupPlans: sanitizeLookupPlans(compileResult.lookupPlans) || {},
            diagnostics: compileResult.diagnostics || []
        }
    };
}

/**
 * @param {import('../types').SearchParameterDefinition[]} definitions
 * @param {Record<string, ReturnType<import('../../compiler/compiler').compileDefinition>>} compileResults
 * @returns {{ header: CompiledArtifactHeader, definitions: Record<string, CompiledArtifactDefinitionEntry> }}
 */
function buildArtifact(definitions, compileResults) {
    /** @type {Record<string, CompiledArtifactDefinitionEntry>} */
    const definitionEntries = {};

    for (const definition of definitions) {
        const compileResult = compileResults[definition.canonicalKey];
        if (!compileResult) {
            throw new Error(
                `Missing compile result for SearchParameter definition: ${definition.canonicalKey}`
            );
        }
        definitionEntries[definition.canonicalKey] = serializeDefinitionEntry(
            definition,
            compileResult
        );
    }

    const body = {
        definitions: sortRecordKeys(definitionEntries)
    };
    const bodyChecksum = computeBodyChecksum(body);

    return {
        header: {
            version: 1,
            generatedAt: new Date().toISOString(),
            checksumAlgorithm: CHECKSUM_ALGORITHM,
            identity: computeCurrentIdentity({ bodyChecksum })
        },
        ...body
    };
}

/**
 * @param {string} [artifactPath]
 * @returns {CompiledBuiltinArtifact}
 */
function readArtifact(artifactPath = ARTIFACT_PATH) {
    if (!fs.existsSync(artifactPath)) {
        throw new Error(
            `SearchParameter compile artifact not found at ${artifactPath}. Run ${BUILD_ARTIFACTS_COMMAND} to generate it.`
        );
    }

    const raw = fs.readFileSync(artifactPath, "utf8");
    /** @type {CompiledBuiltinArtifact} */
    const artifact = JSON.parse(raw);

    if (!artifact.header || !artifact.definitions || typeof artifact.definitions !== "object") {
        throw new Error(
            `SearchParameter compile artifact has an invalid shape. Run ${BUILD_ARTIFACTS_COMMAND} to regenerate it.`
        );
    }

    return artifact;
}

/**
 * @param {import('../types').SearchParameterDefinition[]} definitions
 * @param {Record<string, ReturnType<import('../../compiler/compiler').compileDefinition>>} compileResults
 * @param {string} [artifactPath]
 * @returns {CompiledBuiltinArtifact}
 */
function writeArtifact(definitions, compileResults, artifactPath = ARTIFACT_PATH) {
    const artifact = buildArtifact(definitions, compileResults);
    fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
    fs.writeFileSync(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`);
    return artifact;
}

/**
 * @param {CompiledArtifactDefinitionEntry} entry
 * @returns {import('../types').SearchParameterDefinition}
 */
function hydrateDefinitionEntry(entry) {
    return {
        resource: entry.resource,
        source: entry.source,
        canonicalKey: entry.canonicalKey,
        lookupKeys: entry.lookupKeys,
        rawStatus: entry.rawStatus,
        effectiveStatus: "disabled",
        diagnostics: [],
        lookupPlans: entry.compile.lookupPlans
    };
}

module.exports = {
    ARTIFACT_PATH,
    BUILD_ARTIFACTS_COMMAND,
    computeCurrentIdentity,
    verifyArtifactIdentity,
    readArtifact,
    writeArtifact,
    buildArtifact,
    hydrateDefinitionEntry
};
