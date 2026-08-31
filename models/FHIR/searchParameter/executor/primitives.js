const {
    stringQuery,
    numberQuery,
    tokenQuery,
    referenceQuery,
    quantityQuery,
    uriQuery
} = require("./queryPrimitives");
const { parseTemporalQueryValue } = require("./temporalQueryParser");
const { buildTemporalFilter } = require("./temporalQueryFilter");

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
        case "date": {
            const temporal = parseTemporalQueryValue(value, "date");
            return buildTemporalFilter(
                fieldPath,
                "date",
                temporal,
                comparator ?? temporal.comparator
            );
        }
        case "dateTime": {
            const temporal = parseTemporalQueryValue(value, "dateTime");
            return buildTemporalFilter(
                fieldPath,
                "dateTime",
                temporal,
                comparator ?? temporal.comparator
            );
        }
        case "instant": {
            const temporal = parseTemporalQueryValue(value, "instant");
            return buildTemporalFilter(
                fieldPath,
                "instant",
                temporal,
                comparator ?? temporal.comparator
            );
        }
        case "token": {
            return tokenQuery(value, "", fieldPath, "");
        }
        case "reference":
            return referenceQuery(value, fieldPath);
        case "quantity": {
            const prefixedValue = comparator && comparator !== "eq" ? `${comparator}${value}` : value;
            return quantityQuery(prefixedValue, fieldPath);
        }
        case "uri": {
            const queryKey = modifier ? `${fieldPath}:${modifier}` : fieldPath;
            return { [fieldPath]: uriQuery(value, queryKey) };
        }
        default:
            throw new Error(`Unsupported search type: ${searchType}`);
    }
}

module.exports = {
    buildPrimitiveFilter
};
