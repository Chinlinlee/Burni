const { FHIR_VERSION } = require("../registry/identity");
const { isCompositeSearchType, isPrimitiveSearchType } = require("./capabilityMatrix");

/**
 * @typedef {Object} ResolvedComponentDefinition
 * @property {boolean} found
 * @property {string} [reason]
 * @property {string} [code]
 * @property {import('../registry/types').SearchParameterDefinition} [definition]
 * @property {string} [canonicalKey]
 * @property {string} [definitionUrl]
 * @property {string} [definitionVersion]
 */

/**
 * @typedef {Object} ComponentResolver
 * @property {(definitionReference: string) => ResolvedComponentDefinition} resolve
 */

/**
 * @param {import('../registry/types').SearchParameterDefinition[]} definitions
 * @returns {ComponentResolver}
 */
function createComponentResolver(definitions) {
    /** @type {Map<string, import('../registry/types').SearchParameterDefinition>} */
    const byCanonicalKey = new Map();
    /** @type {Map<string, Map<string, import('../registry/types').SearchParameterDefinition>>} */
    const byUrl = new Map();

    for (const definition of definitions) {
        byCanonicalKey.set(definition.canonicalKey, definition);
        const url = definition.resource.url || "";
        if (!url) {
            continue;
        }
        if (!byUrl.has(url)) {
            byUrl.set(url, new Map());
        }
        byUrl.get(url).set(definition.resource.version || FHIR_VERSION, definition);
    }

    /**
     * @param {string} definitionReference
     * @returns {ResolvedComponentDefinition}
     */
    function resolve(definitionReference) {
        const trimmed = String(definitionReference || "").trim();
        if (!trimmed) {
            return {
                found: false,
                reason: "Component definition reference is required",
                code: "missing-component-definition"
            };
        }

        const pipeIndex = trimmed.indexOf("|");
        const url = pipeIndex >= 0 ? trimmed.slice(0, pipeIndex) : trimmed;
        const explicitVersion = pipeIndex >= 0 ? trimmed.slice(pipeIndex + 1) : undefined;
        const version = explicitVersion || FHIR_VERSION;
        const canonicalKey = `${url}::${version}`;

        let definition = byCanonicalKey.get(canonicalKey);
        const versionsForUrl = byUrl.get(url);

        if (!definition && versionsForUrl) {
            if (explicitVersion && !versionsForUrl.has(explicitVersion)) {
                return {
                    found: false,
                    reason: `Component definition not found for ${url} version ${explicitVersion}`,
                    code: "component-version-mismatch",
                    definitionUrl: url,
                    definitionVersion: explicitVersion
                };
            }
            definition = versionsForUrl.get(version);
        }

        if (!definition) {
            return {
                found: false,
                reason: `Component definition not found for ${url}`,
                code: "component-not-found",
                definitionUrl: url,
                definitionVersion: version
            };
        }

        const componentType = definition.resource.type || "";
        if (isCompositeSearchType(componentType)) {
            return {
                found: false,
                reason: `Component definition ${url} uses unsupported search type composite`,
                code: "unsupported-component-type",
                definition,
                canonicalKey,
                definitionUrl: url,
                definitionVersion: version
            };
        }
        if (componentType === "special") {
            return {
                found: false,
                reason: `Component definition ${url} uses unsupported search type special`,
                code: "unsupported-component-type",
                definition,
                canonicalKey,
                definitionUrl: url,
                definitionVersion: version
            };
        }
        if (!isPrimitiveSearchType(componentType)) {
            return {
                found: false,
                reason: `Component definition ${url} uses unsupported search type ${componentType}`,
                code: "unsupported-component-type",
                definition,
                canonicalKey,
                definitionUrl: url,
                definitionVersion: version
            };
        }
        if (definition.resource.chain?.length) {
            return {
                found: false,
                reason: `Component definition ${url} uses chained search`,
                code: "chained-component",
                definition,
                canonicalKey,
                definitionUrl: url,
                definitionVersion: version
            };
        }

        return {
            found: true,
            definition,
            canonicalKey,
            definitionUrl: url,
            definitionVersion: version
        };
    }

    return { resolve };
}

module.exports = {
    createComponentResolver
};
