const _ = require('lodash');
const jwt = require('jsonwebtoken');
const mongoose = require("mongoose");
const tokenAuthPluginConfig = require("../../../../config").pluginsConfig.tokenAuth;
/**
 * 
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 */
module.exports = async function(req, res) {
    try {
        if (req.user != tokenAuthPluginConfig.admin.username) {
            return res.status(403).send();
        }
        let queryParameter = _.cloneDeep(req.query);
        let paginationSkip = queryParameter['_offset'] == undefined ? 0 : queryParameter['_offset'];
        let paginationLimit = queryParameter['_count'] == undefined ? 100 : queryParameter['_count'];
        _.set(req.query, "_offset", paginationSkip);
        _.set(req.query, "_count", paginationLimit);
        delete queryParameter['_count'];
        delete queryParameter['_offset'];
        let docs = await mongoose.model("issuedToken").find({} , {
            token:1,
            refresh_token: 1,
            _id: 1
        }).
        limit(paginationLimit).
        skip(paginationSkip).
        sort({
            _id: -1
        }).
        exec();
        let decodedTokenList = [];
        for (let doc of docs) {
            let decodedObj = await getDecodedTokenObj(doc.token);
            decodedTokenList.push(Object.assign(doc, decodedObj));
        }
        let count = await mongoose.model("issuedToken").countDocuments({});
        return res.send({
            tokenList : decodedTokenList,
            total: count
        });
    } catch(e) {
        console.error(e);
        return res.status(500).send();
    }
};

function getDecodedTokenObj(token) {
    return new Promise((resolve , reject)=> {
        jwt.verify(token, tokenAuthPluginConfig.jwt.secretKey, function(err, decoded) {
            let tokenObj = decoded;
            tokenObj.status = true;
            tokenObj.message = "good";
            if (err) {
                if (err.name != "TokenExpiredError") {
                    reject(err);
                } else {
                    tokenObj.status = false;
                    tokenObj.message = "token expired";
                }
            } 
            resolve(tokenObj);
        });
    });
}