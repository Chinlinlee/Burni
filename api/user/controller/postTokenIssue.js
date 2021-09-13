
const jwt = require('jsonwebtoken');
const uuid = require('uuid');
const UIDGenerator = require('uid-generator');
const uidGenerator = new UIDGenerator(256);
const mongodb = require('../../../models/mongodb');

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
module.exports = async function (req , res) {
    try {
        if (req.user != process.env.ADMIN_USERNAME) {
            return res.status(403).send();
        }
        let id = await uidGenerator.generate();
        let token = jwt.sign(req.body, process.env.JWT_SECRET_KEY , {expiresIn: '1y', algorithm: "HS256"});
        let tokenObj = new mongodb.issuedToken({
            //...req.body ,
            token: token,
            id: `Bearer ${id}`
        })
        await tokenObj.save();
        return res.status(200).send({
            token: tokenObj.id
        });
    } catch(err) {
        console.error(err);
        return res.status(500).json(err);
    }
}