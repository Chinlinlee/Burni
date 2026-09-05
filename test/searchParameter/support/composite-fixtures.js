const { loadBuiltinBundle } = require("@models/FHIR/searchParameter/registry/sourceAdapter");
const { createSearchQueryPlan } = require("@models/FHIR/searchParameter/compiler/searchQueryPlan");

const OBSERVATION_COMPONENT_CODE_VALUE_QUANTITY_URL =
    "http://hl7.org/fhir/SearchParameter/Observation-component-code-value-quantity";
const GROUP_CHARACTERISTIC_VALUE_URL =
    "http://hl7.org/fhir/SearchParameter/Group-characteristic-value";

/**
 * @param {string} url
 * @returns {import('@models/FHIR/searchParameter/registry/types').SearchParameterResource | undefined}
 */
function findBuiltinResourceByUrl(url) {
    return loadBuiltinBundle().find((resource) => resource.url === url);
}

/**
 * @param {import('@models/FHIR/searchParameter/registry/types').SearchParameterResource} resource
 * @param {'builtin-bundle' | 'database'} [source]
 * @returns {import('@models/FHIR/searchParameter/registry/types').SearchParameterDefinition}
 */
function toDefinition(resource, source = "builtin-bundle") {
    const version = resource.version || "4.0.1";
    const canonicalKey = `${resource.url}::${version}`;
    const lookupKeys = (resource.base || []).map((base) => `${base}::${resource.code}`);
    return {
        resource,
        source,
        canonicalKey,
        lookupKeys,
        rawStatus: resource.status || "unknown",
        effectiveStatus: "disabled",
        diagnostics: []
    };
}

/**
 * @returns {import('@models/FHIR/searchParameter/registry/types').SearchParameterDefinition}
 */
function observationComponentCodeValueQuantityDefinition() {
    const resource = findBuiltinResourceByUrl(OBSERVATION_COMPONENT_CODE_VALUE_QUANTITY_URL);
    if (!resource) {
        throw new Error("Missing Observation component-code-value-quantity fixture");
    }
    return toDefinition(resource);
}

/**
 * @returns {import('@models/FHIR/searchParameter/registry/types').SearchParameterDefinition}
 */
function groupCharacteristicValueDefinition() {
    const resource = findBuiltinResourceByUrl(GROUP_CHARACTERISTIC_VALUE_URL);
    if (!resource) {
        throw new Error("Missing Group characteristic-value fixture");
    }
    return toDefinition(resource);
}

/**
 * @param {import('@models/FHIR/searchParameter/registry/types').SearchParameterDefinition} compositeDefinition
 * @returns {import('@models/FHIR/searchParameter/registry/types').SearchParameterDefinition[]}
 */
function componentDefinitionsForComposite(compositeDefinition) {
    const components = compositeDefinition.resource.component || [];
    const bundle = loadBuiltinBundle();
    /** @type {import('@models/FHIR/searchParameter/registry/types').SearchParameterDefinition[]} */
    const definitions = [];

    for (const component of components) {
        const definitionUrl = String(component.definition || "").split("|")[0];
        const resource = bundle.find((entry) => entry.url === definitionUrl);
        if (!resource) {
            continue;
        }
        definitions.push(toDefinition(resource));
    }

    return definitions;
}

/**
 * @param {import('@models/FHIR/searchParameter/registry/types').SearchParameterDefinition} compositeDefinition
 * @returns {import('@models/FHIR/searchParameter/registry/types').SearchParameterDefinition[]}
 */
function compileSetForComposite(compositeDefinition) {
    const componentDefinitions = componentDefinitionsForComposite(compositeDefinition);
    const seen = new Set();
    /** @type {import('@models/FHIR/searchParameter/registry/types').SearchParameterDefinition[]} */
    const definitions = [];

    for (const definition of [...componentDefinitions, compositeDefinition]) {
        if (seen.has(definition.canonicalKey)) {
            continue;
        }
        seen.add(definition.canonicalKey);
        definitions.push(definition);
    }

    return definitions;
}

/**
 * @param {Partial<import('@models/FHIR/searchParameter/compiler/searchQueryPlan').SearchQueryPlan>} [overrides]
 * @returns {import('@models/FHIR/searchParameter/compiler/searchQueryPlan').SearchQueryPlan}
 */
function minimalCompositePlan(overrides = {}) {
    const { composite: compositeOverride, ...planOverrides } = overrides;
    const plan = createSearchQueryPlan({
        canonicalKey:
            planOverrides.canonicalKey ||
            "http://hl7.org/fhir/SearchParameter/Observation-component-code-value-quantity::4.0.1",
        resourceType: planOverrides.resourceType || "Observation",
        code: planOverrides.code || "component-code-value-quantity",
        searchType: "composite",
        kind: "filter",
        extractionPaths: planOverrides.extractionPaths || [
            {
                path: "component",
                datatype: "BackboneElement",
                correlation: {
                    kind: "same-array-element",
                    parentPath: "component",
                    fields: ["code", "valueQuantity"]
                }
            }
        ],
        multipleOr: false,
        multipleAnd: true,
        comparators: [],
        modifiers: [],
        depth: 1,
        estimatedCost: 2,
        requiredIndexes: [],
        diagnostics: [],
        ...planOverrides
    });

    plan.composite =
        compositeOverride || {
            components: [
                {
                    definitionKey:
                        "http://hl7.org/fhir/SearchParameter/Observation-component-code::4.0.1",
                    code: "component-code",
                    searchType: "token",
                    comparators: [],
                    modifiers: ["missing"]
                },
                {
                    definitionKey:
                        "http://hl7.org/fhir/SearchParameter/Observation-component-value-quantity::4.0.1",
                    code: "component-value-quantity",
                    searchType: "quantity",
                    comparators: ["eq", "ne", "lt", "gt", "ge", "le", "sa", "eb", "ap"],
                    modifiers: ["missing"]
                }
            ],
            branches: [
                {
                    correlationMode: "array-element",
                    scopePath: "component",
                    components: [
                        {
                            componentIndex: 0,
                            extractionPath: { path: "code", datatype: "CodeableConcept" }
                        },
                        {
                            componentIndex: 1,
                            extractionPath: { path: "valueQuantity", datatype: "Quantity" }
                        }
                    ]
                }
            ]
        };

    return plan;
}

module.exports = {
    OBSERVATION_COMPONENT_CODE_VALUE_QUANTITY_URL,
    GROUP_CHARACTERISTIC_VALUE_URL,
    findBuiltinResourceByUrl,
    toDefinition,
    observationComponentCodeValueQuantityDefinition,
    groupCharacteristicValueDefinition,
    componentDefinitionsForComposite,
    compileSetForComposite,
    minimalCompositePlan
};
