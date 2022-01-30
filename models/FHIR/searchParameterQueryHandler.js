const queryBuild = require('./queryBuild');
const _ = require('lodash');

function getStringQuery(query, paramsSearchFields, queryFieldName) {
    if (!_.isArray(query[queryFieldName])) {
        query[queryFieldName] = [query[queryFieldName]];
    }
    for (let item of query[queryFieldName]) {
        let buildQs = {
            $or: []
        };
        for (let field of paramsSearchFields[queryFieldName]) {
            let buildResult = {
                [field] : queryBuild.stringQuery(item, field)
            };
            buildQs.$or.push(buildResult);
        }
        query.$and.push({
            ...buildQs
        });
    }
    delete query[queryFieldName];
}

function getTokenQuery(query, paramsSearchFields, queryFieldName) {
    if (!_.isArray(query[queryFieldName])) {
        query[queryFieldName] = [query[queryFieldName]];
    }
    for (let item of query[queryFieldName]) {
        let buildQs = {
            $or : []
        };
        for (let field of paramsSearchFields["identifier"]) {
            let buildResult =queryBuild.tokenQuery(item , "value" , field);
            buildQs.$or = [...buildQs.$or , ...buildResult.$or];
        }
        query.$and.push({
            ...buildQs
        });
    }
    delete query['identifier'];
}

/**
 * 
 * @param {Object} query 
 * @param {string} paramsSearchFields 
 * @param {string} queryFieldName 
 * @param {function} paramsSearchFunc 
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

function getPolyDateQuery() {

}

module.exports = {
    getStringQuery: getStringQuery
};