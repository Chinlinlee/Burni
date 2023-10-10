const _ = require("lodash");
const jwt = require("jsonwebtoken");
const UIDGenerator = require("uid-generator");
const uidGenerator = new UIDGenerator(256);
const mongoose = require("mongoose");
const tokenAuthPluginConfig =
    require("../../../../config").pluginsConfig.tokenAuth;

module.exports = async function (needSignData, expiresIn = "1y") {
    try {
        let id = await uidGenerator.generate();
        let refresh_token = await uidGenerator.generate();

        let scope = accessListToScope(needSignData.accessList);
        _.set(needSignData, "scope", scope);
        delete needSignData["accessList"];

        let token = jwt.sign(
            needSignData,
            tokenAuthPluginConfig.jwt.secretKey,
            { expiresIn: expiresIn, algorithm: "HS256" }
        );
        let tokenObj = new mongoose.model("issuedToken")({
            token: token,
            id: id,
            scope: scope,
            refresh_token: refresh_token
        });
        await tokenObj.save();
        return {
            status: true,
            data: tokenObj
        };
    } catch (e) {
        console.error(e);
        return {
            status: false,
            data: e
        };
    }
};

const interactions = [
    "create",
    "delete",
    "history",
    "read",
    "search-type",
    "update",
    "vread"
];

function accessListToScope(accessList) {
    let scope = "";
    let scopeList = [];
    for (let accessItem of accessList) {
        let resourceType = _.get(accessItem, "resourceType");
        Object.keys(accessItem).forEach((key) => {
            if (interactions.includes(key) && accessItem[key]) {
                scopeList.push(`${resourceType}:${key}`);
            }
        });
    }
    scope = scopeList.join(" ");
    return scope;
}
