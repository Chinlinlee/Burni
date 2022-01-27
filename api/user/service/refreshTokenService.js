const jwt = require('jsonwebtoken');
const uuid = require('uuid');
const UIDGenerator = require('uid-generator');
const uidGenerator = new UIDGenerator(256);
const mongodb = require('../../../models/mongodb');

module.exports = async function (refresh_token,expiresIn='1y') {
    try {
        let hitTokenObj = await mongodb.issuedToken.findOne({
            refresh_token: refresh_token
        });
        if (!hitTokenObj) {
            return {
                status: false,
                code: 404,
                data: "Not found with refresh token"
            };
        }
        let decodedTokenObj = jwt.decode(hitTokenObj.token, { complete:true });
        let id = await uidGenerator.generate();
        let refresh_token = await uidGenerator.generate();
        let token = jwt.sign(decodedTokenObj, process.env.JWT_SECRET_KEY , {expiresIn: expiresIn, algorithm: "HS256"});
        
        let tokenObj = {
            token: token,
            id: `Bearer ${id}`,
            refresh_token: refresh_token
        };
        await mongodb.issuedToken.findOneAndUpdate({
            refresh_token: refresh_token
        } , tokenObj);
        return {
            status : true,
            code: 200,
            data: tokenObj
        };
    } catch(e) {
        console.error(e);
        return {
            status: false,
            code : 500,
            data: e
        };
    }
};