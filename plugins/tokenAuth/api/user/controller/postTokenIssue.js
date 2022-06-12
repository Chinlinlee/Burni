
const tokenIssueService = require('../service/tokenIssueService');
const tokenAuthPluginConfig = require("../../../../config").pluginsConfig.tokenAuth;

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
module.exports = async function (req , res) {
    try {
        if (req.user != tokenAuthPluginConfig.admin.username) {
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
};