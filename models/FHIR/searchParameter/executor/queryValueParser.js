const { getTypeCapability, validateOperator } = require("../compiler/capabilityMatrix");

const { getCommaSplitArray } = require("@models/FHIR/queryBuild");

const {
    buildProjectedFilter,
    buildDeceasedCombinedFilter
} = require("./searchTypeProjection");

const MAX_QUERY_COST = 10;



/**

 * @typedef {Object} ParsedSearchValue

 * @property {string[]} values

 * @property {string | undefined} modifier

 * @property {string | undefined} comparator

 */



/**

 * @param {string} rawValue

 * @param {string} parameterName

 * @returns {ParsedSearchValue}

 */

function parseSearchValue(rawValue, parameterName) {

    const [namePart, ...modifierParts] = parameterName.split(":");

    const modifier = modifierParts.length > 0 ? modifierParts.join(":") : undefined;

    let comparator;

    let value = rawValue;

    const prefixMatch = /^(eq|ne|lt|gt|ge|le|sa|eb|ap)(.+)$/.exec(rawValue);

    if (prefixMatch) {

        comparator = prefixMatch[1];

        value = prefixMatch[2];

    }

    return {

        values: getCommaSplitArray(value),

        modifier,

        comparator

    };

}



/**

 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan

 * @param {string} value

 * @param {string | undefined} modifier

 * @param {string | undefined} comparator

 * @returns {Object}

 */

function buildFilterForValue(plan, value, modifier, comparator) {
    if (plan.code === "deceased" && modifier !== "missing") {
        return buildDeceasedCombinedFilter(plan, value, modifier, comparator);
    }

    const branchFilters = plan.extractionPaths.map((entry) =>
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
    );

    if (branchFilters.length === 1) {
        return branchFilters[0];
    }

    return { $or: branchFilters };
}



/**

 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan

 * @param {string} rawValue

 * @param {string} parameterName

 * @returns {{ valid: boolean, reason?: string, filter?: Object }}

 */

function validateAndBuildFilter(plan, rawValue, parameterName) {

    if (plan.estimatedCost > MAX_QUERY_COST) {

        return { valid: false, reason: "Estimated query cost exceeds limit" };

    }



    const parsed = parseSearchValue(rawValue, parameterName);
    const operatorValidation = validateOperator(
        plan.searchType,
        parsed.modifier,
        parsed.comparator
    );
    if (!operatorValidation.valid) {
        return { valid: false, reason: operatorValidation.reason };
    }

    if (parsed.modifier === "missing" && parsed.values.some((entry) => !["true", "false"].includes(entry))) {
        return { valid: false, reason: "missing modifier requires true or false" };
    }



    const capability = getTypeCapability(plan.searchType);

    if (!capability) {

        return { valid: false, reason: `Unsupported search type: ${plan.searchType}` };

    }



    if (parsed.values.length > 1 && !capability.multipleOr) {

        return { valid: false, reason: "multipleOr is not allowed for this parameter" };

    }



    if (plan.extractionPaths.length === 0) {

        return { valid: false, reason: "Missing extraction paths in query plan" };

    }



    const filters = parsed.values.map((value) =>

        buildFilterForValue(plan, value, parsed.modifier, parsed.comparator)

    );



    if (filters.length === 1) {

        return { valid: true, filter: filters[0] };

    }



    return {

        valid: true,

        filter: {

            [plan.multipleAnd ? "$and" : "$or"]: filters

        }

    };

}



module.exports = {

    MAX_QUERY_COST,

    parseSearchValue,

    validateAndBuildFilter,

    buildFilterForValue

};

