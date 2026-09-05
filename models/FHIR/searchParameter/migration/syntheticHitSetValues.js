const ARRAY_PATH_ROOTS = new Set([
    "useContext",
    "identifier",
    "telecom",
    "name",
    "address",
    "component",
    "relatedArtifact",
    "category",
    "coding",
    "subject",
    "performer",
    "participant",
    "link",
    "contained"
]);
const ARRAY_LEAF_DATATYPES = new Set([
    "Identifier",
    "ContactPoint",
    "HumanName",
    "Address",
    "Coding"
]);

/**
 * @param {string} searchType
 * @param {string} [parameterName]
 * @returns {string}
 */
function getSampleValue(searchType, parameterName = "") {
    if (parameterName === "gender") {
        return "male";
    }
    if (parameterName === "identifier") {
        return "http://example.org|test-id";
    }
    if (parameterName.includes("status")) {
        return "active";
    }
    if (parameterName.includes("birth") || parameterName.includes("date")) {
        return "1999-12-12";
    }

    switch (searchType) {
        case "number":
            return "eq42";
        case "date":
        case "dateTime":
            return "1999-12-12";
        case "token":
            return "official";
        case "reference":
            return "Patient/example";
        case "quantity":
            return "eq10|kg";
        case "uri":
            return "http://example.org/test";
        case "string":
        default:
            return "smith";
    }
}

/**
 * @param {import('../compiler/searchQueryPlan').ExtractionPath} extractionPath
 * @returns {string | null}
 */
function getTypePredicateValue(extractionPath) {
    return extractionPath.predicates?.find((entry) => entry.kind === "typeEquals")?.value || null;
}

/**
 * @param {import('../compiler/searchQueryPlan').ExtractionPath} extractionPath
 * @returns {string | null}
 */
function getSystemPredicateValue(extractionPath) {
    return extractionPath.predicates?.find((entry) => entry.kind === "systemEquals")?.value || null;
}

/**
 * @param {string} searchType
 * @param {string} code
 * @param {import('../compiler/searchQueryPlan').ExtractionPath} extractionPath
 * @param {string} [resourceType]
 * @returns {unknown}
 */
function buildSyntheticFieldValue(searchType, code, extractionPath, resourceType) {
    const datatype = extractionPath.datatype;
    const typePredicate = getTypePredicateValue(extractionPath);
    const systemPredicate = getSystemPredicateValue(extractionPath);

    if (systemPredicate && datatype === "ContactPoint") {
        return { system: systemPredicate, value: `hit-set-${code}@example.org` };
    }

    if (typePredicate && extractionPath.correlation?.kind === "same-array-element") {
        const parentPath = extractionPath.correlation.parentPath || extractionPath.path.split(".")[0];
        const leaf = extractionPath.path.split(".").slice(1).join(".");
        const leafValue =
            datatype === "canonical"
                ? `ActivityDefinition/hit-set-${code}`
                : datatype === "uri"
                  ? `http://example.org/${code}`
                  : `${code}-value`;
        return {
            [parentPath]: [
                {
                    type: typePredicate,
                    [leaf]: leafValue
                }
            ]
        };
    }

    switch (searchType) {
        case "token":
            if (datatype === "boolean") {
                return true;
            }
            if (
                datatype === "code" ||
                datatype === "string" ||
                datatype === "id" ||
                datatype === "dateTime"
            ) {
                return `${code}-value`;
            }
            if (datatype === "Identifier" || datatype === "ContactPoint") {
                return { system: "urn:burni:hit-set", value: `${code}-value` };
            }
            if (datatype === "CodeableConcept" || datatype === "Coding") {
                return {
                    system: "urn:burni:hit-set",
                    code: `${code}-value`
                };
            }
            return { system: "urn:burni:hit-set", code: `${code}-value` };
        case "string":
            if (datatype === "HumanName") {
                return { family: `hit-set-${code}` };
            }
            if (datatype === "Address") {
                return { city: `hit-set-${code}` };
            }
            return `hit-set-${code}`;
        case "reference": {
            if (datatype === "uri" || datatype === "url") {
                return `${resourceType || "Patient"}/hit-set-${code}`;
            }
            const targetType = extractionPath.referenceTargetType || "Patient";
            if (datatype === "canonical") {
                return `${targetType}/hit-set-${code}`;
            }
            return { reference: `${targetType}/hit-set-${code}` };
        }
        case "date":
        case "dateTime":
            if (datatype === "Period") {
                return { start: "2000-01-01", end: "2000-01-02" };
            }
            if (datatype === "instant") {
                return "2000-01-01T12:00:00.000Z";
            }
            if (datatype === "dateTime") {
                return "2000-01-01T12:00:00.000Z";
            }
            return "2000-01-01";
        case "quantity":
            return {
                value: 10,
                system: "kg"
            };
        case "number":
            return 42;
        case "uri":
            return `http://example.org/${code}`;
        default:
            return getSampleValue(searchType, code);
    }
}

/**
 * @param {unknown} fieldValue
 * @param {string} datatype
 * @returns {unknown}
 */
function normalizeAssignedValue(fieldValue, datatype) {
    if (datatype === "CodeableConcept") {
        if (fieldValue && typeof fieldValue === "object" && "coding" in fieldValue) {
            return fieldValue;
        }
        return {
            coding: [fieldValue]
        };
    }
    if (ARRAY_LEAF_DATATYPES.has(datatype)) {
        return Array.isArray(fieldValue) ? fieldValue : [fieldValue];
    }
    return fieldValue;
}

/**
 * @param {string} searchType
 * @param {string} code
 * @param {unknown} fieldValue
 * @param {import('../compiler/searchQueryPlan').ExtractionPath} extractionPath
 * @returns {string}
 */
function formatSyntheticQueryValue(searchType, code, fieldValue, extractionPath) {
    const systemPredicate = getSystemPredicateValue(extractionPath);
    if (systemPredicate && extractionPath.datatype === "ContactPoint") {
        return typeof fieldValue === "object" && fieldValue && "value" in fieldValue
            ? String(fieldValue.value)
            : String(fieldValue);
    }

    const { formatSearchValue } = require("./fixtureValueExtractor");
    const plan = {
        code,
        searchType,
        extractionPaths: [extractionPath]
    };

    if (
        fieldValue &&
        typeof fieldValue === "object" &&
        extractionPath.correlation?.parentPath &&
        extractionPath.correlation.parentPath in fieldValue
    ) {
        const arrayValue = fieldValue[extractionPath.correlation.parentPath];
        const element = Array.isArray(arrayValue) ? arrayValue[0] : arrayValue;
        const leaf = extractionPath.path.split(".").slice(1).join(".");
        const leafValue = leaf.split(".").reduce((current, segment) => current?.[segment], element);
        const formatted = formatSearchValue(
            leafValue,
            extractionPath.datatype,
            code,
            plan,
            extractionPath
        );
        if (formatted) {
            return formatted;
        }
    }

    const normalized = normalizeAssignedValue(fieldValue, extractionPath.datatype);
    const sample =
        Array.isArray(normalized) && normalized.length > 0 ? normalized[0] : normalized;
    const formatted = formatSearchValue(
        sample,
        extractionPath.datatype,
        code,
        plan,
        extractionPath
    );
    if (formatted) {
        return formatted;
    }
    return getSampleValue(searchType, code);
}

/**
 * @param {Object} target
 * @param {string[]} segments
 * @param {unknown} value
 * @param {string} datatype
 * @param {string[]} [arrayPaths]
 */
function setNestedValue(target, segments, value, datatype, arrayPaths = []) {
    const arrayRoots = new Set([
        ...ARRAY_PATH_ROOTS,
        ...arrayPaths.map((entry) => entry.split(".")[0])
    ]);
    if (
        value &&
        typeof value === "object" &&
        segments.length === 1 &&
        segments[0] in value &&
        Array.isArray(value[segments[0]])
    ) {
        target[segments[0]] = value[segments[0]];
        return;
    }

    if (segments.length > 1 && arrayRoots.has(segments[0])) {
        const [root, ...rest] = segments;
        if (!Array.isArray(target[root]) || target[root].length === 0) {
            target[root] = [{}];
        }
        setNestedValue(target[root][0], rest, value, datatype, arrayPaths);
        return;
    }

    let current = target;
    for (let index = 0; index < segments.length - 1; index += 1) {
        const segment = segments[index];
        if (!(segment in current) || current[segment] == null) {
            current[segment] = {};
        }
        if (Array.isArray(current[segment])) {
            if (current[segment].length === 0) {
                current[segment].push({});
            }
            current = current[segment][0];
        } else if (
            typeof current[segment] === "object" &&
            segments[index + 1] &&
            !(segments[index + 1] in current[segment])
        ) {
            const nextSegment = segments[index + 1];
            const remaining = segments.slice(index + 1);
            const isArrayParent = remaining.length > 1 || ARRAY_LEAF_DATATYPES.has(datatype);
            if (isArrayParent && !Array.isArray(current[segment])) {
                current[segment] = [{}];
                current = current[segment][0];
                index += 0;
                continue;
            }
            current = current[segment];
        } else {
            current = current[segment];
        }
    }
    const leaf = segments[segments.length - 1];
    current[leaf] = normalizeAssignedValue(value, datatype);
}

/**
 * @param {Object} document
 * @param {import('../compiler/searchQueryPlan').BundleInlineTarget} inlineTarget
 * @param {string} resourceId
 */
function setBundleInlineResource(document, inlineTarget, resourceId) {
    document.type = inlineTarget.bundleTypePredicate;

    const inlineResource = {
        resourceType: inlineTarget.targetResourceType,
        id: resourceId
    };
    const segments = inlineTarget.inlinePath.split(".");
    let current = document;

    for (let index = 0; index < segments.length; index += 1) {
        const segment = segments[index];
        const isLast = index === segments.length - 1;
        if (isLast) {
            current[segment] = inlineResource;
            return;
        }

        const nextSegment = segments[index + 1];
        if (/^\d+$/.test(nextSegment)) {
            const arrayIndex = Number(nextSegment);
            if (!Array.isArray(current[segment])) {
                current[segment] = [];
            }
            while (current[segment].length <= arrayIndex) {
                current[segment].push({});
            }
            current = current[segment][arrayIndex];
            index += 1;
            continue;
        }

        if (!(segment in current) || current[segment] == null) {
            current[segment] = {};
        }
        current = current[segment];
    }
}

/**
 * @param {Object} document
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @returns {{ document: Object, queryValue: string }}
 */
function augmentBundleInlineDocument(document, plan) {
    const augmented = JSON.parse(JSON.stringify(document));
    const hitSetId = `hit-set-${plan.code}`;
    setBundleInlineResource(augmented, plan.inlineTarget, hitSetId);
    return {
        document: augmented,
        queryValue: `${plan.inlineTarget.targetResourceType}/${hitSetId}`
    };
}

/**
 * @param {Object} document
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @returns {{ document: Object, queryValue: string } | null}
 */
function augmentCompositeDocument(document, plan) {
    const branch = plan.composite?.branches?.[0];
    const components = plan.composite?.components || [];
    if (!branch || components.length === 0 || branch.components.length !== components.length) {
        return null;
    }

    const augmented = JSON.parse(JSON.stringify(document));
    const componentValues = [];
    const scopeElement = {};

    for (const branchComponent of branch.components) {
        const component = components[branchComponent.componentIndex];
        const extractionPath = branchComponent.extractionPath;
        const fieldValue = buildSyntheticFieldValue(
            component.searchType,
            `${plan.code}-${component.code}`,
            extractionPath,
            plan.resourceType
        );
        const target = branch.correlationMode === "array-element" ? scopeElement : augmented;
        const targetPath =
            branch.correlationMode === "array-element"
                ? extractionPath.path
                : [branch.scopePath, extractionPath.path].filter(Boolean).join(".");
        setNestedValue(
            target,
            targetPath.split("."),
            fieldValue,
            extractionPath.datatype,
            extractionPath.arrayPaths || []
        );
        componentValues.push(
            formatSyntheticQueryValue(
                component.searchType,
                component.code,
                fieldValue,
                extractionPath
            )
        );
    }

    if (branch.correlationMode === "array-element") {
        setNestedValue(
            augmented,
            branch.scopePath.split("."),
            [scopeElement],
            "BackboneElement"
        );
    }

    return {
        document: augmented,
        queryValue: componentValues.join("$")
    };
}

/**
 * @param {Object} document
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @returns {{ document: Object, queryValue: string } | null}
 */
function augmentDocumentForHitSet(document, plan) {
    if (plan.inlineTarget) {
        return augmentBundleInlineDocument(document, plan);
    }
    if (plan.searchType === "composite") {
        return augmentCompositeDocument(document, plan);
    }

    const augmented = JSON.parse(JSON.stringify(document));
    const extractionPath = plan.extractionPaths[0];
    if (!extractionPath) {
        return null;
    }

    const fieldValue = buildSyntheticFieldValue(
        plan.searchType,
        plan.code,
        extractionPath,
        plan.resourceType
    );
    if (
        fieldValue &&
        typeof fieldValue === "object" &&
        extractionPath.correlation?.parentPath &&
        extractionPath.correlation.parentPath in fieldValue
    ) {
        Object.assign(augmented, fieldValue);
    } else {
        setNestedValue(
            augmented,
            extractionPath.path.split("."),
            fieldValue,
            extractionPath.datatype,
            extractionPath.arrayPaths || []
        );
    }

    const queryValue = formatSyntheticQueryValue(
        plan.searchType,
        plan.code,
        fieldValue,
        extractionPath
    );

    return {
        document: augmented,
        queryValue
    };
}

module.exports = {
    augmentDocumentForHitSet,
    augmentCompositeDocument,
    buildSyntheticFieldValue,
    formatSyntheticQueryValue,
    normalizeAssignedValue
};
