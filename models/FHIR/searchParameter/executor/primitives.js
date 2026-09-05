const {
    stringQuery,
    numberQuery,
    tokenQuery,
    referenceQuery,
    quantityQuery
} = require("./queryPrimitives");
const { buildTemporalSearchFilter } = require("./temporalQuery");
const { buildUriSearchFilter } = require("./uriValueParser");

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
            return { [fieldPath]: stringQuery(value, queryKey) };
        }
        case "number": {
            const prefixedValue = comparator && comparator !== "eq" ? `${comparator}${value}` : value;
            const result = numberQuery(prefixedValue, fieldPath);
            if (!result) {
                throw new Error(`invalid number: ${value}`);
            }
            return result;
        }
        case "date":
            return buildTemporalSearchFilter(fieldPath, "date", value, { comparator });
        case "dateTime":
            return buildTemporalSearchFilter(fieldPath, "dateTime", value, { comparator });
        case "instant":
            return buildTemporalSearchFilter(fieldPath, "instant", value, { comparator });
        case "token": {
            return tokenQuery(value, "", fieldPath, "");
        }
        case "reference":
            return referenceQuery(value, fieldPath);
        case "quantity": {
            const prefixedValue = comparator && comparator !== "eq" ? `${comparator}${value}` : value;
            return quantityQuery(prefixedValue, fieldPath);
        }
        case "uri":
            return buildUriSearchFilter(value, fieldPath, modifier);
        default:
            throw new Error(`Unsupported search type: ${searchType}`);
    }
}

module.exports = {
    buildPrimitiveFilter
};
