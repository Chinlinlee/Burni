const jwt = require("jsonwebtoken");
const { generateRandomToken } = require("@root/utils/randomToken");
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
        let id = generateRandomToken();
        let newRefreshToken = generateRandomToken();
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
