
const jwt = require('jsonwebtoken');
const uuid = require('uuid');
const UIDGenerator = require('uid-generator');
const uidGenerator = new UIDGenerator(256);
const mongodb = require('../../../models/mongodb');
const tokenIssueService = require('../service/tokenIssueService');

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
module.exports = async function (req , res) {
    try {
        if (req.user != process.env.ADMIN_USERNAME) {
            return res.status(403).send();
        }
        let tokenObj = await tokenIssueService(req.body);
        if (tokenObj.status) {
            return res.status(200).send({
                token: tokenObj.data.id,
                refresh_token: tokenObj.data.refresh_token
            });
        }
        return res.status(500).send(tokenObj.data);
    } catch(err) {
        console.error(err);
        return res.status(500).json(err);
    }
}