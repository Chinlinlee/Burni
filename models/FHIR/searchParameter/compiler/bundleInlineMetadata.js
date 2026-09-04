/**
 * @typedef {'embedded'} BundleInlineTargetMode
 */

/**
 * @typedef {Object} BundleInlineTarget
 * @property {BundleInlineTargetMode} mode
 * @property {string} inlinePath
 * @property {string} targetResourceType
 * @property {string} bundleTypePredicate
 */

/** @type {Readonly<Record<string, Omit<BundleInlineTarget, 'mode'>>>} */
const CANONICAL_BUNDLE_INLINE_LOOKUPS = Object.freeze({
    composition: Object.freeze({
        inlinePath: "entry.0.resource",
        targetResourceType: "Composition",
        bundleTypePredicate: "document"
    }),
    message: Object.freeze({
        inlinePath: "entry.0.resource",
        targetResourceType: "MessageHeader",
        bundleTypePredicate: "message"
    })
});

/**
 * @param {import('./extractionPathCompiler').ExtractionPath[]} extractionPaths
 * @param {string} expectedPath
 * @returns {boolean}
 */
function hasSingleResourceExtractionPath(extractionPaths, expectedPath) {
    if (extractionPaths.length !== 1) {
        return false;
    }
    const [path] = extractionPaths;
    return path.path === expectedPath && path.datatype === "Resource";
}

/**
 * @param {string[]} targets
 * @param {string} expectedTarget
 * @returns {boolean}
 */
function hasSingleDeclaredTarget(targets, expectedTarget) {
    return targets.length === 1 && targets[0] === expectedTarget;
}

/**
 * @param {string} resourceType
 * @param {string} code
 * @param {import('./extractionPathCompiler').ExtractionPath[]} extractionPaths
 * @param {string[]} targets
 * @returns {BundleInlineTarget | undefined}
 */
function resolveBundleInlineTarget(resourceType, code, extractionPaths, targets) {
    if (resourceType !== "Bundle") {
        return undefined;
    }
    const spec = CANONICAL_BUNDLE_INLINE_LOOKUPS[code];
    if (!spec) {
        return undefined;
    }
    if (!hasSingleResourceExtractionPath(extractionPaths, spec.inlinePath)) {
        return undefined;
    }
    if (!hasSingleDeclaredTarget(targets, spec.targetResourceType)) {
        return undefined;
    }
    return {
        mode: "embedded",
        inlinePath: spec.inlinePath,
        targetResourceType: spec.targetResourceType,
        bundleTypePredicate: spec.bundleTypePredicate
    };
}

/**
 * @param {import('./extractionPathCompiler').ExtractionPath} extractionPath
 * @param {string} prefix
 * @returns {import('./extractionPathCompiler').ExtractionPath}
 */
function prefixExtractionPath(extractionPath, prefix) {
    const path = `${prefix}.${extractionPath.path}`;
    const correlation = extractionPath.correlation
        ? {
              ...extractionPath.correlation,
              parentPath: extractionPath.correlation.parentPath
                  ? `${prefix}.${extractionPath.correlation.parentPath}`
                  : prefix
          }
        : undefined;
    return {
        ...extractionPath,
        path,
        correlation
    };
}

/**
 * @param {import('./searchQueryPlan').SearchQueryPlan} plan
 * @param {string} prefix
 * @returns {import('./searchQueryPlan').SearchQueryPlan}
 */
function prefixPlanExtractionPaths(plan, prefix) {
    return {
        ...plan,
        extractionPaths: plan.extractionPaths.map((entry) => prefixExtractionPath(entry, prefix))
    };
}

module.exports = {
    CANONICAL_BUNDLE_INLINE_LOOKUPS,
    resolveBundleInlineTarget,
    prefixPlanExtractionPaths
};
