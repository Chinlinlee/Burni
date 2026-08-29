const queryBuild = require("@models/FHIR/queryBuild");
const searchParameterQueryHandler = require("@models/FHIR/searchParameterQueryHandler");

/**
 * @param {string} searchType
 * @param {string} value
 * @param {string} fieldPath
 * @param {string | undefined} modifier
 * @param {string | undefined} comparator
 * @returns {Object}
 */
function buildPrimitiveFilter(searchType, value, fieldPath, modifier, comparator) {
    switch (searchType) {
        case "string": {
            const queryKey = modifier ? `${fieldPath}:${modifier}` : fieldPath;
            return { [fieldPath]: queryBuild.stringQuery(value, queryKey) };
        }
        case "number": {
            const prefixedValue = comparator && comparator !== "eq" ? `${comparator}${value}` : value;
            const result = queryBuild.numberQuery(prefixedValue, fieldPath);
            if (!result) {
                throw new Error(`invalid number: ${value}`);
            }
            return result;
        }
        case "date":
        case "dateTime": {
            const prefixedValue = comparator && comparator !== "eq" ? `${comparator}${value}` : value;
            const result = queryBuild.dateQuery(prefixedValue, fieldPath);
            if (!result) {
                throw new Error(`invalid date: ${value}`);
            }
            return result;
        }
        case "token": {
            return queryBuild.tokenQuery(value, "", fieldPath, "");
        }
        case "reference":
            return queryBuild.referenceQuery(value, fieldPath);
        case "quantity": {
            const prefixedValue = comparator && comparator !== "eq" ? `${comparator}${value}` : value;
            return queryBuild.quantityQuery(prefixedValue, fieldPath);
        }
        case "uri": {
            const queryKey = modifier ? `${fieldPath}:${modifier}` : fieldPath;
            return { [fieldPath]: queryBuild.uriQuery(value, queryKey) };
        }
        default:
            throw new Error(`Unsupported search type: ${searchType}`);
    }
}

module.exports = {
    buildPrimitiveFilter,
    searchParameterQueryHandler,
    queryBuild
};
