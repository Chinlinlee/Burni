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

/**
 * @param {import('./searchQueryPlan').CompositeRootBranch} branch
 * @returns {import('./extractionPathCompiler').ExtractionPath}
 */
function buildCompositeRootExtractionPath(branch) {
    const fields = branch.components.map((entry) => entry.extractionPath.path);
    if (branch.correlationMode === "array-element") {
        return {
            path: branch.scopePath,
            datatype: "BackboneElement",
            correlation: {
                kind: "same-array-element",
                parentPath: branch.scopePath,
                fields
            }
        };
    }

    return {
        path: branch.scopePath || branch.branchId || "",
        datatype: "BackboneElement",
        correlation: undefined
    };
}

/**
 * @param {import('./searchQueryPlan').CompositeRootBranch[]} branches
 * @returns {import('./extractionPathCompiler').ExtractionPath[]}
 */
function buildCompositeRootExtractionPaths(branches) {
    return branches.map(buildCompositeRootExtractionPath).filter((entry) => entry.path || entry.correlation);
}

/**
 * @param {import('./searchQueryPlan').CompositeRootBranch[]} branches
 * @returns {string[]}
 */
function deriveCompositeRequiredIndexes(branches) {
    const indexes = [];
    for (const branch of branches) {
        const root = branch.scopePath.split(".")[0];
        if (root && !indexes.includes(root)) {
            indexes.push(root);
        }
    }
    return indexes;
}

/**
 * @param {import('./searchQueryPlan').CompositeRootBranch[]} branches
 * @param {number} componentCount
 * @returns {number}
 */
function estimateCompositeCost(branches, componentCount) {
    const branchCount = Math.max(branches.length, 1);
    const extractionBranchCount = branches.reduce((total, branch) => {
        return (
            total +
            branch.components.reduce(
                (componentTotal, component) => componentTotal + (component.extractionPath.path.includes(".") ? 2 : 1),
                0
            )
        );
    }, 0);
    return Math.max(branchCount * componentCount, extractionBranchCount);
}

/**
 * @param {Object} input
 * @param {import('../registry/types').SearchParameterResource} input.resource
 * @param {import('./searchQueryPlan').CompositeComponentDefinition[]} input.compositeComponents
 * @param {import('./searchQueryPlan').CompositeComponentSummary[]} input.componentSummaries
 * @param {import('./searchQueryPlan').CompositeRootBranch[]} input.branches
 * @returns {{
 *   extractionPaths: import('./extractionPathCompiler').ExtractionPath[],
 *   components: import('./searchQueryPlan').CompositeComponentSummary[],
 *   composite: import('./searchQueryPlan').CompositePlanMetadata,
 *   estimatedCost: number,
 *   requiredIndexes: string[]
 * }}
 */
function attachCompositePlanMetadata(input) {
    const extractionPaths = buildCompositeRootExtractionPaths(input.branches);
    return {
        extractionPaths,
        components: input.componentSummaries,
        composite: {
            components: input.compositeComponents.map((component) => ({
                index: component.index,
                definitionKey: component.definitionKey,
                code: component.code,
                searchType: component.searchType,
                comparators: component.comparators,
                modifiers: component.modifiers,
                multipleOr: component.multipleOr,
                multipleAnd: component.multipleAnd
            })),
            branches: input.branches
        },
        estimatedCost: estimateCompositeCost(input.branches, input.compositeComponents.length),
        requiredIndexes: deriveCompositeRequiredIndexes(input.branches)
    };
}

module.exports = {
    REFERENCE_VALUE_FORMS,
    UNSUPPORTED_REFERENCE_VALUE_FORMS,
    deriveCorrelation,
    attachPathCorrelation,
    deriveTargets,
    deriveSupportedValueForms,
    attachPlanMetadata,
    buildCompositeRootExtractionPath,
    buildCompositeRootExtractionPaths,
    deriveCompositeRequiredIndexes,
    estimateCompositeCost,
    attachCompositePlanMetadata
};
