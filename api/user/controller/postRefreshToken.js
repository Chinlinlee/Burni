
const jwt = require('jsonwebtoken');
const uuid = require('uuid');
const UIDGenerator = require('uid-generator');
const uidGenerator = new UIDGenerator(256);
const mongodb = require('../../../models/mongodb');
const refreshTokenService = require('../service/refreshTokenService');

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
module.exports = async function (req , res) {
    try {
        let refreshToken = req.body.refresh_token;
        let tokenObj = await refreshTokenService(refreshToken);
        if (tokenObj.status) {
            return res.status(tokenObj.code).send({
                token: tokenObj.data.id,
                refresh_token: tokenObj.data.refresh_token
            });
        }
        return res.status(tokenObj.code).send(tokenObj.data);
    } catch(err) {
        console.error(err);
        return res.status(500).json(err);
    }
}