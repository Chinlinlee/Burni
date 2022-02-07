const queryBuild = require('./queryBuild');
const _ = require('lodash');
const { getCommaSplitArray } = require('./queryBuild');

/**
 * @example <caption>Example of `address-city` of search parameter of the Patient resource</caption>
 * // refresh query object to 
 * // {
 * //    "$and": [
 * //       {
 * //           "$or": [
 * //               {
 * //                   "address.city": {
 * //                       "$regex": /^PleasantVille/gi
 * //                   }
 * //               }
 * //          ]
 * //      }
 * //   ]
 * // }
 * getStringQuery(
 * {
 *    "address-city": "PleasantVille",
 *    "gender": "male",
 *    "$and": []
 * }, ["address.city"], "address-city");
 * @param {string} query The request query object 
 * @param {Array<string>} paramsSearchFields The fields of search parameters that in resource
 * @param {string} queryFieldName The name of search parameter
 */
function getStringQuery(query, paramsSearchFields, queryFieldName) {
    if (!_.isArray(query[queryFieldName])) {
        query[queryFieldName] = [query[queryFieldName]];
    }
    for (let item of query[queryFieldName]) {
        let buildQs = {
            $or: []
        };
        for (let field of paramsSearchFields[queryFieldName]) {
            let commaSeparatedValue = getCommaSplitArray(item);
            for (let index in commaSeparatedValue) {
                let value = commaSeparatedValue[index];
                let buildResult = {
                    [field] : queryBuild.stringQuery(value, queryFieldName)
                };
                buildQs.$or.push(buildResult);
            }
        }
        query.$and.push({
            ...buildQs
        });
    }
    delete query[queryFieldName];
}

/**
 * @example <caption>Example of `address` of search parameter of the Patient resource</caption>
 * // refresh query object to 
 * // {
 * //     "$and": [
 * //         {
 * //             "$or": [
 * //                 {
 * //                     "address.line": {
 * //                         "$regex": /^PleasantVille/gi
 * //                     }
 * //                 },
 * //                 {
 * //                     "address.city": {
 * //                         "$regex": /^PleasantVille/gi
 * //                     }
 * //                 },
 * //                 {
 * //                     "address.district": {
 * //                         "$regex": /^PleasantVille/gi
 * //                     }
 * //                 },
 * //                 {
 * //                     "address.state": {
 * //                         "$regex": /^PleasantVille/gi
 * //                     }
 * //                 },
 * //                 {
 * //                     "address.postalCode": {
 * //                         "$regex": /^PleasantVille/gi
 * //                     }
 * //                 },
 * //                 {
 * //                     "address.country": {
 * //                         "$regex": /^PleasantVille/gi
 * //                     }
 * //                 }
 * //             ]
 * //         }
 * //     ]
 * // }
 * getAddressQuery(
 * {
 *    "address": "PleasantVille",
 *    "gender": "male",
 *    "$and": []
 * }, "address");
 * @param {string} query The request query object 
 * @param {string} queryFieldName The name of search parameter 
 */
function getAddressQuery(query, queryFieldName) {
    if (!_.isArray(query[queryFieldName])) {
        query[queryFieldName] = [query[queryFieldName]];
    }
    for (let item of query[queryFieldName]) {
        let buildQs = {
            $or : []
        };
        let buildResult = queryBuild.addressQuery(item, queryFieldName);
        buildQs.$or = [...buildQs.$or , ...buildResult.$or];
        query.$and.push({
            ...buildQs
        });
    }
    delete query[queryFieldName];
}

/**
 * @example <caption>Example of `name` of search parameter of the Patient resource</caption>
 * // refresh query object to 
 * // {
 * //     "$and": [
 * //         {
 * //             "$or": [
 * //                 {
 * //                     "$or": [
 * //                         {
 * //                             "name.text": {
 * //                                 "$regex": /^Chalmers/gi
 * //                             }
 * //                         },
 * //                         {
 * //                             "name.family": {
 * //                                 "$regex": /^Chalmers/gi
 * //                             }
 * //                         },
 * //                         {
 * //                             "name.given": {
 * //                                 "$regex": /^Chalmers/gi
 * //                             }
 * //                         },
 * //                         {
 * //                             "name.suffix": {
 * //                                 "$regex": /^Chalmers/gi
 * //                             }
 * //                         },
 * //                         {
 * //                             "name.prefix": {
 * //                                 "$regex": /^Chalmers/gi
 * //                             }
 * //                         }
 * //                     ]
 * //                 }
 * //             ]
 * //         }
 * //     ]
 * // }
 * getNameQuery(
 * {
 *     "name": "Chalmers"
 * }, ["name"], "name");
 * @param {string} query The request query object 
 * that in resource
 *  * @param {string} queryFieldName The name of search parameter
 */
function getNameQuery(query, queryFieldName) {
    if (!_.isArray(query[queryFieldName])) {
        query[queryFieldName] = [query[queryFieldName]];
    }
    for (let item of query[queryFieldName]) {
        let buildQs = {
            $or : []
        };
        let buildResult = queryBuild.nameQuery(item , queryFieldName);
        buildQs.$or.push(buildResult);
        query.$and.push({
            ...buildQs
        });
    }
    delete query[queryFieldName];
}

/**
 * 
 * @param {string} query 
 * @param {Array<string>} paramsSearchFields 
 * @param {string} queryFieldName 
 */
function getTokenQuery(query, paramsSearchFields, queryFieldName) {
    if (!_.isArray(query[queryFieldName])) {
        query[queryFieldName] = [query[queryFieldName]];
    }
    for (let item of query[queryFieldName]) {
        let buildQs = {
            $or : []
        };
        for (let field of paramsSearchFields[queryFieldName]) {
            let buildResult =queryBuild.tokenQuery(item , "value" , field);
            buildQs.$or.push(buildResult);
        }
        query.$and.push({
            ...buildQs
        });
    }
    delete query[queryFieldName];
    console.log(JSON.stringify(query, null , 4));
}

/**
 * @example <caption>Example of `address-use` of search parameter of the Patient resource</caption>
 * // refresh query object to 
 * // {
 * //     "$and": [
 * //         {
 * //             "$or": [
 * //                 {
 * //                     "$or": [
 * //                         {
 * //                             "address.use.system": "home" //because some data types have system 
 * //                         },
 * //                         {
 * //                             "address.use": "home"
 * //                         }
 * //                     ]
 * //                 }
 * //             ]
 * //         }
 * //     ]
 * // }
 * getPolyTokenQuery(
 * {
 *     "address-use": "home"
 * }, ["address.use"], "address-use", (query)=> {
 *     try {
 *           queryHandler.getStringQuery(query, paramsSearchFields, *"address-city");
 *       } catch (e) {
 *           console.error(e);
 *           throw e;
 *       }
 * });
 * @param {Object} query The request query object
 * @param {Array<string>} paramsSearchFields The fields of search parameters that in resource
 * @param {string} queryFieldName The name of search parameter
 * @param {function} paramsSearchFunc parameter search function corresponds to data type e.g. code, codeable concept
 */
function getPolyTokenQuery(query, paramsSearchFields, queryFieldName, paramsSearchFunc) {
    if (!_.isArray(query[queryFieldName])) {
        query[queryFieldName] = [query[queryFieldName]];
    }
    for (let item of query[queryFieldName]) {
        let buildQs = {
            $or: []
        };
        for (let field of paramsSearchFields[queryFieldName]) {
            let buildResult = paramsSearchFunc[field](item, field);
            buildQs.$or.push(buildResult);
        }
        query.$and.push({
            ...buildQs
        });
    }
    delete query[queryFieldName];
}

/**
 * @example <caption>Example of `variant-start` of search parameter of the Molecularsequence resource</caption>
 * // refresh query object to 
 * // {
 * //     "$and": [
 * //         {
 * //             "$or": [
 * //                 {
 * //                     "variant.start": {
 * //                         "$eq": 22125503
 * //                     }
 * //                 }
 * //             ]
 * //         }
 * //     ]
 * // }
 * getNumberQuery(
 * {
 *     "$and": [], 
 *     "variant-start" : 22125503
 * }, ["variant.start"], "variant-start");
 * @param {string} query The request query object 
 * @param {Array<string>} paramsSearchFields The fields of search parameters that in resource
 * @param {string} queryFieldName The name of search parameter
 */
function getNumberQuery(query, paramsSearchFields, queryFieldName) {
    if (!_.isArray(query[queryFieldName])) {
        query[queryFieldName] = [query[queryFieldName]];
    }
    for (let item of query[queryFieldName]) {
        let buildQs = {
            $or: []
        };
        for (let field of paramsSearchFields[queryFieldName]) {
            let buildResult = queryBuild.numberQuery(item, field);
            buildQs.$or.push(buildResult);
        }
        query.$and.push({
            ...buildQs
        });
    }
    delete query[queryFieldName];
}

/**
 * 
 * @param {Object} query The request query object
 * @param {string} paramsSearchFields The fields of search parameters that in resource
 * @param {string} queryFieldName The name of search parameter
 * @param {function} paramsSearchFunc parameter search function corresponds to data type e.g. date, dateTime
 */
function getPolyDateQuery(query, paramsSearchFields, queryFieldName, paramsSearchFunc) {
    if (!_.isArray(query[queryFieldName])) {
        query[queryFieldName] = [query[queryFieldName]];
    }
    for (let item of query[queryFieldName]) {
        let buildQs = {
            $or: []
        };
        for (let field of paramsSearchFields[queryFieldName]) {
            let buildResult = paramsSearchFunc[field](item, field);
            buildQs.$or.push(buildResult);
        }
        query.$and.push({
            ...buildQs
        });
    }
    delete query[queryFieldName];
}

function getReferenceQuery(query, paramsSearchFields, queryFieldName, type="") {
    if (!_.isArray(query[queryFieldName])) {
        query[queryFieldName] = [query[queryFieldName]];
    }
    for (let item of query[queryFieldName]) {
        let buildQs = {
            $or : []
        };
        for (let field of paramsSearchFields[queryFieldName]) {
            let buildResult =queryBuild.referenceQuery(item , field, type);
            buildQs.$or.push(buildResult);
        }
        query.$and.push({
            ...buildQs
        });
    }
    delete query[queryFieldName];
}

function getQuantityQuery (query, paramsSearchFields, queryFieldName) {
    if (!_.isArray(query[queryFieldName])) {
        query[queryFieldName] = [query[queryFieldName]];
    }
    for (let item of query[queryFieldName]) {
        let buildQs = {
            $or: []
        };
        for (let field of paramsSearchFields[queryFieldName]) {
            let buildResult = queryBuild.quantityQuery(item, field);
            buildQs.$or.push(buildResult);
        }
        query.$and.push({
            ...buildQs
        });
    }
    delete query[queryFieldName];
}

module.exports = {
    getStringQuery: getStringQuery,
    getAddressQuery: getAddressQuery,
    getNameQuery: getNameQuery,
    getTokenQuery: getTokenQuery,
    getPolyTokenQuery: getPolyTokenQuery,
    getNumberQuery: getNumberQuery,
    getPolyDateQuery: getPolyDateQuery,
    getReferenceQuery: getReferenceQuery,
    getQuantityQuery: getQuantityQuery
};