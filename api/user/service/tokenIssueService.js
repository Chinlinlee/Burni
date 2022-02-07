const jwt = require('jsonwebtoken');
const uuid = require('uuid');
const UIDGenerator = require('uid-generator');
const uidGenerator = new UIDGenerator(256);
const mongodb = require('../../../models/mongodb');

module.exports = async function (needSignData,expiresIn='1y') {
    try {
        let id = await uidGenerator.generate();
        let refresh_token = await uidGenerator.generate();
        let token = jwt.sign(needSignData, process.env.JWT_SECRET_KEY , {expiresIn: expiresIn, algorithm: "HS256"});
        let tokenObj = new mongodb.issuedToken({
            //...req.body ,
            token: token,
            id: `Bearer ${id}`,
            refresh_token: refresh_token
        });
        await tokenObj.save();
        return {
            status : true,
            data: tokenObj
        };
    } catch(e) {
        console.error(e);
        return {
            status: false,
            data: e
        };
    }
};