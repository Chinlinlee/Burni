const _ = require('lodash');
const mongodb = require('../../../models/mongodb');
/**
 * 
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 */
module.exports = async function(req, res) {
    if (req.user != process.env.ADMIN_USERNAME) {
        return res.status(403).send();
    }
    let queryParameter = _.cloneDeep(req.query);
    let paginationSkip = queryParameter['_offset'] == undefined ? 0 : queryParameter['_offset'];
    let paginationLimit = queryParameter['_count'] == undefined ? 100 : queryParameter['_count'];
    _.set(req.query, "_offset", paginationSkip);
    _.set(req.query, "_count", paginationLimit);
    delete queryParameter['_count'];
    delete queryParameter['_offset'];
    let docs = await mongodb.issuedToken.find({} , {
        accessList: 1,
        tokenName: 1,
        tokenNote: 1,
        _id: 1
    }).
    limit(paginationLimit).
    skip(paginationSkip).
    sort({
        _id: -1
    }).
    exec();
    let count = await mongodb.issuedToken.countDocuments({});
    return res.send({
        tokenList : docs,
        total: count
    });
}