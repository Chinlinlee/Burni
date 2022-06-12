const jwt = require("jsonwebtoken");
const UIDGenerator = require("uid-generator");
const uidGenerator = new UIDGenerator(256);
const mongoose = require("mongoose");
const tokenAuthPluginConfig =
    require("../../../../config").pluginsConfig.tokenAuth;

module.exports = async function (refreshToken, expiresIn = "1y") {
    try {
        let hitTokenObj = await mongoose.model("issuedToken").findOne({
            refresh_token: refreshToken
        });
        if (!hitTokenObj) {
            return {
                status: false,
                code: 404,
                data: "Not found with refresh token"
            };
        }
        let decodedTokenObj = jwt.decode(hitTokenObj.token, { complete: true });
        let id = await uidGenerator.generate();
        let newRefreshToken = await uidGenerator.generate();
        let token = jwt.sign(
            decodedTokenObj,
            tokenAuthPluginConfig.jwt.secretKey,
            { expiresIn: expiresIn, algorithm: "HS256" }
        );

        let tokenObj = {
            token: token,
            id: `Bearer ${id}`,
            refresh_token: newRefreshToken
        };
        await mongoose.model("issuedToken").findOneAndUpdate(
            {
                refresh_token: refreshToken
            },
            tokenObj
        );
        return {
            status: true,
            code: 200,
            data: tokenObj
        };
    } catch (e) {
        console.error(e);
        return {
            status: false,
            code: 500,
            data: e
        };
    }
};
