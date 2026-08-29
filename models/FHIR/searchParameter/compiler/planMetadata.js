/**
 * @typedef {'type/id' | 'id' | 'absolute-url'} ReferenceValueForm
 */

/**
 * @typedef {Object} PathCorrelation
 * @property {'same-array-element' | 'none'} kind
 * @property {string} [parentPath]
 * @property {string[]} [fields]
 */

const REFERENCE_VALUE_FORMS = Object.freeze(["type/id", "id", "absolute-url"]);
const UNSUPPORTED_REFERENCE_VALUE_FORMS = Object.freeze(["versioned", "contained", "identifier"]);
const CORRELATED_PREDICATE_KINDS = new Set(["systemEquals", "typeEquals"]);

/**
 * @param {string} [kind]
 * @returns {string | undefined}
 */
function predicateFieldName(kind) {
    if (kind === "systemEquals") {
        return "system";
    }
    if (kind === "typeEquals") {
        return "type";
    }
    return undefined;
}

/**
 * Same-array-element correlation is required when a type guard or literal
 * predicate must hold on the same FHIR element as the searchable value.
 * @param {import('./extractionPathCompiler').ExtractionPath} extractionPath
 * @returns {PathCorrelation | undefined}
 */
function deriveCorrelation(extractionPath) {
    const predicates = extractionPath.predicates || [];
    const correlatedPredicates = predicates.filter((entry) =>
        CORRELATED_PREDICATE_KINDS.has(entry.kind)
    );

    if (correlatedPredicates.length > 0) {
        const segments = extractionPath.path.split(".");
        const parentPath = segments[0];
        const fields = [];
        for (const predicate of correlatedPredicates) {
            const field = predicateFieldName(predicate.kind);
            if (field && !fields.includes(field)) {
                fields.push(field);
            }
        }
        if (segments.length > 1) {
            fields.push(segments.slice(1).join("."));
        } else if (extractionPath.datatype === "Reference") {
            fields.push("reference");
        } else {
            fields.push("value");
        }
        return {
            kind: "same-array-element",
            parentPath,
            fields
        };
    }

    if (extractionPath.referenceTargetType && extractionPath.datatype === "Reference") {
        return {
            kind: "same-array-element",
            parentPath: extractionPath.path,
            fields: ["reference", "type"]
        };
    }

    return undefined;
}

/**
 * @param {import('./extractionPathCompiler').ExtractionPath} extractionPath
 * @returns {import('./extractionPathCompiler').ExtractionPath}
 */
function attachPathCorrelation(extractionPath) {
    const correlation = deriveCorrelation(extractionPath);
    if (!correlation) {
        return extractionPath;
    }
    return {
        ...extractionPath,
        correlation
    };
}

/**
 * @param {import('../registry/types').SearchParameterResource} resource
 * @param {import('./extractionPathCompiler').ExtractionPath[]} extractionPaths
 * @returns {string[]}
 */
function deriveTargets(resource, extractionPaths) {
    const unique = [];
    for (const target of resource.target || []) {
        if (target && !unique.includes(target)) {
            unique.push(target);
        }
    }
    for (const entry of extractionPaths) {
        if (entry.referenceTargetType && !unique.includes(entry.referenceTargetType)) {
            unique.push(entry.referenceTargetType);
        }
    }
    return unique;
}

/**
 * @param {string} searchType
 * @returns {ReferenceValueForm[]}
 */
function deriveSupportedValueForms(searchType) {
    if (searchType === "reference") {
        return [...REFERENCE_VALUE_FORMS];
    }
    return [];
}

/**
 * @param {import('../registry/types').SearchParameterResource} resource
 * @param {import('./extractionPathCompiler').ExtractionPath[]} extractionPaths
 * @param {string} searchType
 * @returns {{
 *   extractionPaths: import('./extractionPathCompiler').ExtractionPath[],
 *   targets: string[],
 *   supportedValueForms: ReferenceValueForm[]
 * }}
 */
function attachPlanMetadata(resource, extractionPaths, searchType) {
    const annotatedPaths = extractionPaths.map(attachPathCorrelation);
    return {
        extractionPaths: annotatedPaths,
        targets: deriveTargets(resource, annotatedPaths),
        supportedValueForms: deriveSupportedValueForms(searchType)
    };
}

module.exports = {
    REFERENCE_VALUE_FORMS,
    UNSUPPORTED_REFERENCE_VALUE_FORMS,
    deriveCorrelation,
    attachPathCorrelation,
    deriveTargets,
    deriveSupportedValueForms,
    attachPlanMetadata
};
