const queryBuild = require('./queryBuild');
const _ = require('_');

function getStringQuery(query, paramsSearchFields, queryFieldName) {
    if (!_.isArray(query[queryFieldName])) {
        query[queryFieldName] = [query[queryFieldName]];
    }
    for (let item of query[queryFieldName]) {
        let buildQs = {
            $or: []
        };
        for (let field of paramsSearchFields[queryFieldName]) {
            let buildResult = queryBuild.stringQuery(item, field);
            buildQs.$or = [...buildQs.$or, ...buildResult.$or];
        }
        query.$and.push({
            ...buildQs
        });
    }
    delete query[queryFieldName];
}

function getFixedTokenQuery() {

}

function getTokenQuery(query, paramsSearchFields, queryFieldName) {
    
}

module.exports = {
    getStringQuery: getStringQuery
};