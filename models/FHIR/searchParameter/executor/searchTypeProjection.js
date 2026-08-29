const queryBuild = require("@models/FHIR/queryBuild");
const {
    normalizeReferenceQueryValue,
    validateReferenceQueryValue
} = require("./referenceValueParser");

const NON_PROJECTABLE_DATATYPES = new Set([
    "BackboneElement",
    "Element",
    "Narrative",
    "Extension",
    "Meta",
    "Timing",
    "Range",
    "Ratio",
    "Annotation"
]);

const ADDRESS_STRING_FIELDS = ["line", "city", "district", "state", "postalCode", "country"];
const HUMAN_NAME_STRING_FIELDS = ["text", "family", "given", "prefix", "suffix"];

/**
 * @param {string} searchType
 * @param {string} datatype
 * @returns {boolean}
 */
function hasSearchTypeProjection(searchType, datatype) {
    if (!datatype) {
        return false;
    }
    if (searchType === "quantity" && datatype === "SampledData") {
        return false;
    }
    if (NON_PROJECTABLE_DATATYPES.has(datatype)) {
        return false;
    }

    switch (searchType) {
        case "string":
            return (
                datatype === "Address" ||
                datatype === "HumanName" ||
                datatype === "string" ||
                datatype === "uri" ||
                datatype === "code"
            );
        case "token":
            return (
                datatype === "CodeableConcept" ||
                datatype === "Identifier" ||
                datatype === "ContactPoint" ||
                datatype === "Coding" ||
                datatype === "code" ||
                datatype === "boolean" ||
                datatype === "string" ||
                datatype === "dateTime"
            );
        case "reference":
            return datatype === "Reference";
        case "date":
        case "dateTime":
            return (
                datatype === "Period" ||
                datatype === "date" ||
                datatype === "dateTime" ||
                datatype === "instant"
            );
        case "quantity":
            return datatype === "Quantity";
        case "number":
            return (
                datatype === "decimal" ||
                datatype === "integer" ||
                datatype === "positiveInt" ||
                datatype === "unsignedInt" ||
                datatype === "number"
            );
        case "uri":
            return datatype === "uri" || datatype === "url" || datatype === "canonical";
        default:
            return false;
    }
}

/**
 * @param {{ kind: string, value?: string }[] | undefined} predicates
 * @param {string} kind
 * @returns {{ kind: string, value?: string } | undefined}
 */
function findPredicate(predicates, kind) {
    return predicates?.find((entry) => entry.kind === kind);
}

/**
 * @param {string} searchType
 * @param {string} value
 * @param {string} fieldPath
 * @param {string} datatype
 * @param {string | undefined} modifier
 * @param {string | undefined} comparator
 * @param {string | undefined} referenceTargetType
 * @param {{ kind: string, value?: string }[] | undefined} predicates
 * @returns {Object}
 */
function buildProjectedFilter(
    searchType,
    value,
    fieldPath,
    datatype,
    modifier,
    comparator,
    referenceTargetType,
    predicates
) {
    if (modifier === "missing") {
        return buildMissingProjection(searchType, fieldPath, datatype, value, predicates);
    }

    switch (searchType) {
        case "string":
            return buildStringProjection(value, fieldPath, datatype, modifier);
        case "token":
            return buildTokenProjection(value, fieldPath, datatype, modifier, predicates);
        case "reference":
            return buildReferenceProjection(value, fieldPath, referenceTargetType);
        case "date":
        case "dateTime":
            return buildDateProjection(value, fieldPath, datatype, comparator, searchType);
        case "quantity":
            return buildQuantityProjection(value, fieldPath, comparator);
        case "number":
            return buildNumberProjection(value, fieldPath, comparator);
        case "uri":
            return buildUriProjection(value, fieldPath, modifier);
        default:
            throw new Error(`Unsupported search type: ${searchType}`);
    }
}

/**
 * @param {string} searchType
 * @param {string} fieldPath
 * @param {string} datatype
 * @param {string} rawValue
 * @param {{ kind: string, value?: string }[] | undefined} predicates
 * @returns {Object}
 */
function buildMissingProjection(searchType, fieldPath, datatype, rawValue, predicates) {
    const expectMissing = rawValue === "true";
    const presenceFilters = buildPresenceFilters(
        searchType,
        fieldPath,
        datatype,
        predicates
    );
    if (expectMissing) {
        return { $nor: presenceFilters };
    }
    return { $or: presenceFilters };
}

/**
 * @param {string} searchType
 * @param {string} fieldPath
 * @param {string} datatype
 * @param {{ kind: string, value?: string }[] | undefined} predicates
 * @returns {Object[]}
 */
function buildPresenceFilters(searchType, fieldPath, datatype, predicates) {
    const systemPredicate = findPredicate(predicates, "systemEquals");
    if (systemPredicate?.value) {
        return [
            {
                [fieldPath]: {
                    $elemMatch: {
                        system: systemPredicate.value,
                        value: { $exists: true, $nin: [null, ""] }
                    }
                }
            }
        ];
    }

    if (findPredicate(predicates, "deceasedPresence")) {
        return [
            { deceasedBoolean: { $exists: true, $ne: null } },
            { deceasedDateTime: { $exists: true, $ne: null } }
        ];
    }

    if (datatype === "Address") {
        return ADDRESS_STRING_FIELDS.map((leaf) => ({
            [`${fieldPath}.${leaf}`]: { $exists: true, $nin: [null, ""] }
        }));
    }
    if (datatype === "HumanName") {
        return HUMAN_NAME_STRING_FIELDS.map((leaf) => ({
            [`${fieldPath}.${leaf}`]: { $exists: true, $nin: [null, ""] }
        }));
    }
    if (datatype === "CodeableConcept") {
        return [
            { [`${fieldPath}.coding.code`]: { $exists: true, $nin: [null, ""] } },
            { [`${fieldPath}.coding.system`]: { $exists: true, $nin: [null, ""] } }
        ];
    }
    if (datatype === "Identifier" || datatype === "ContactPoint") {
        return [
            { [`${fieldPath}.value`]: { $exists: true, $nin: [null, ""] } },
            { [`${fieldPath}.system`]: { $exists: true, $nin: [null, ""] } }
        ];
    }
    if (datatype === "Reference") {
        return [{ [`${fieldPath}.reference`]: { $exists: true, $nin: [null, ""] } }];
    }

    return [{ [fieldPath]: { $exists: true, $nin: [null, ""] } }];
}

/**
 * @param {string} value
 * @param {string} fieldPath
 * @param {string} datatype
 * @param {string | undefined} modifier
 * @returns {Object}
 */
function buildStringProjection(value, fieldPath, datatype, modifier) {
    const queryKey = modifier ? `${fieldPath}:${modifier}` : fieldPath;
    const stringMatcher = queryBuild.stringQuery(value, queryKey);

    if (datatype === "Address") {
        return {
            $or: ADDRESS_STRING_FIELDS.map((leaf) => ({
                [`${fieldPath}.${leaf}`]: stringMatcher
            }))
        };
    }
    if (datatype === "HumanName") {
        return {
            $or: HUMAN_NAME_STRING_FIELDS.map((leaf) => ({
                [`${fieldPath}.${leaf}`]: stringMatcher
            }))
        };
    }

    return { [fieldPath]: stringMatcher };
}

/**
 * @param {string} value
 * @param {string} fieldPath
 * @param {string} datatype
 * @param {string | undefined} modifier
 * @param {{ kind: string, value?: string }[] | undefined} predicates
 * @returns {Object}
 */
function buildTokenProjection(value, fieldPath, datatype, modifier, predicates) {
    const systemPredicate = findPredicate(predicates, "systemEquals");
    if (systemPredicate?.value && datatype === "ContactPoint") {
        return buildCorrelatedContactPointFilter(fieldPath, systemPredicate.value, value, modifier);
    }

    if (findPredicate(predicates, "deceasedPresence")) {
        return buildDeceasedTokenFilter(value, fieldPath, datatype);
    }

    if (modifier === "text" && datatype === "CodeableConcept") {
        return { [`${fieldPath}.text`]: value };
    }

    if (datatype === "CodeableConcept") {
        return queryBuild.tokenQuery(value, "coding.code", fieldPath, "", true);
    }
    if (datatype === "Coding") {
        return {
            $or: [
                queryBuild.tokenQuery(value, "code", fieldPath),
                queryBuild.tokenQuery(value, "system", fieldPath)
            ]
        };
    }
    if (datatype === "Identifier" || datatype === "ContactPoint") {
        return {
            $or: [
                queryBuild.tokenQuery(value, "value", fieldPath),
                queryBuild.tokenQuery(value, "system", fieldPath)
            ]
        };
    }

    return queryBuild.tokenQuery(value, "", fieldPath, "");
}

/**
 * @param {string} fieldPath
 * @param {string} systemValue
 * @param {string} value
 * @param {string | undefined} modifier
 * @returns {Object}
 */
function buildCorrelatedContactPointFilter(fieldPath, systemValue, value, modifier) {
    const valueMatcher = queryBuild.tokenQuery(value, "value", fieldPath, modifier || "", false);
    const matchedValue = valueMatcher[`${fieldPath}.value`] ?? valueMatcher.value ?? value;
    return {
        [fieldPath]: {
            $elemMatch: {
                system: systemValue,
                value: matchedValue
            }
        }
    };
}

/**
 * @param {string} value
 * @param {string} fieldPath
 * @param {string} datatype
 * @returns {Object}
 */
function buildDeceasedTokenFilter(value, fieldPath, datatype) {
    const normalized = String(value).toLowerCase();
    if (normalized === "true") {
        if (datatype === "dateTime") {
            return { [fieldPath]: { $exists: true, $ne: null } };
        }
        return { [fieldPath]: true };
    }
    if (normalized === "false") {
        if (datatype === "dateTime") {
            return { _id: { $exists: false } };
        }
        return { [fieldPath]: false };
    }
    return queryBuild.tokenQuery(value, "", fieldPath, "");
}

/**
 * @param {string} value
 * @param {string} fieldPath
 * @param {string} datatype
 * @param {string | undefined} comparator
 * @param {string} searchType
 * @returns {Object}
 */
function buildDateProjection(value, fieldPath, datatype, comparator, searchType) {
    const prefixedValue =
        comparator && comparator !== "eq" ? `${comparator}${value}` : value;
    if (datatype === "Period") {
        return queryBuild.periodQuery(prefixedValue, fieldPath);
    }
    const queryFn = searchType === "dateTime" ? queryBuild.dateTimeQuery : queryBuild.dateQuery;
    const result = queryFn(prefixedValue, fieldPath);
    if (!result) {
        throw new Error(`invalid date: ${value}`);
    }
    return result;
}

/**
 * @param {string} value
 * @param {string} fieldPath
 * @param {string | undefined} comparator
 * @returns {Object}
 */
function buildQuantityProjection(value, fieldPath, comparator) {
    const prefixedValue =
        comparator && comparator !== "eq" ? `${comparator}${value}` : value;
    const result = queryBuild.quantityQuery(prefixedValue, fieldPath);
    if (!result) {
        throw new Error(`invalid quantity: ${value}`);
    }
    return result;
}

/**
 * @param {string} value
 * @param {string} fieldPath
 * @param {string | undefined} comparator
 * @returns {Object}
 */
function buildNumberProjection(value, fieldPath, comparator) {
    const prefixedValue =
        comparator && comparator !== "eq" ? `${comparator}${value}` : value;
    const result = queryBuild.numberQuery(prefixedValue, fieldPath);
    if (!result) {
        throw new Error(`invalid number: ${value}`);
    }
    return result;
}

/**
 * @param {string} value
 * @param {string} fieldPath
 * @param {string | undefined} modifier
 * @returns {Object}
 */
function buildUriProjection(value, fieldPath, modifier) {
    const queryKey = modifier ? `${fieldPath}:${modifier}` : fieldPath;
    return { [fieldPath]: queryBuild.uriQuery(value, queryKey) };
}

/**
 * @param {string} value
 * @param {string} fieldPath
 * @param {string | undefined} referenceTargetType
 * @returns {Object}
 */
function buildReferenceProjection(value, fieldPath, referenceTargetType) {
    const validation = validateReferenceQueryValue(value);
    if (!validation.valid) {
        throw new Error(validation.reason || "Invalid reference value");
    }

    const normalized = normalizeReferenceQueryValue(value, referenceTargetType);
    if (!normalized.valid || !normalized.normalizedValue) {
        throw new Error(normalized.reason || "Invalid reference value");
    }

    const referenceValue = normalized.normalizedValue;
    const targetType = referenceTargetType;
    const referenceField = `${fieldPath}.reference`;
    const typeField = `${fieldPath}.type`;
    const referenceMatcher = queryBuild.referenceQuery(referenceValue, referenceField);

    if (!targetType) {
        return referenceMatcher;
    }

    const scalarGuard = {
        $and: [
            referenceMatcher,
            {
                $or: [{ [typeField]: { $exists: false } }, { [typeField]: targetType }]
            }
        ]
    };
    const arrayGuard = {
        [fieldPath]: {
            $elemMatch: {
                reference: referenceMatcher[referenceField] || referenceValue,
                $or: [{ type: { $exists: false } }, { type: targetType }]
            }
        }
    };

    return {
        $or: [scalarGuard, arrayGuard]
    };
}

/**
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @param {string} value
 * @param {string | undefined} modifier
 * @param {string | undefined} comparator
 * @returns {Object}
 */
function buildDeceasedCombinedFilter(plan, value, modifier, comparator) {
    const branchFilters = plan.extractionPaths
        .map((entry) =>
            buildProjectedFilter(
                plan.searchType,
                value,
                entry.path,
                entry.datatype,
                modifier,
                comparator,
                entry.referenceTargetType,
                entry.predicates
            )
        )
        .filter((filter) => !filter._id || filter._id.$exists !== false);

    if (String(value).toLowerCase() === "false") {
        const booleanBranch = branchFilters.find((entry) => entry.deceasedBoolean !== undefined);
        return booleanBranch || { deceasedBoolean: false };
    }

    if (branchFilters.length === 0) {
        return { _id: { $exists: false } };
    }
    if (branchFilters.length === 1) {
        return branchFilters[0];
    }
    return { $or: branchFilters };
}

module.exports = {
    hasSearchTypeProjection,
    buildProjectedFilter,
    buildDeceasedCombinedFilter,
    buildCorrelatedContactPointFilter,
    ADDRESS_STRING_FIELDS,
    HUMAN_NAME_STRING_FIELDS
};
