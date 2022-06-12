const _ = require("lodash");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const {
    handleError,
    ErrorOperationOutcome
} = require("../../../../../models/FHIR/httpMessage");
const tokenAuthPluginConfig =
    require("../../../../config").pluginsConfig.tokenAuth;
/**
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns
 */
function checkIsLoggedIn(req, res, next) {
    if (!req.isAuthenticated()) {
        return res.status(401).send();
    }
    return next();
}

/**
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns
 */
async function tokenAuthentication(req, res, next) {
    try {
        let token = _.get(req.headers, "authorization", false);
        if (!token) {
            return res
                .status(400)
                .send(handleError.security("missing authorization in headers"));
        }
        token = token.replace("Bearer ", "");
        let tokenInDb = await mongoose.model("issuedToken").findOne({
            id: token
        });
        if (tokenInDb) {
            let verifyResult = await verifyJWT(
                tokenInDb.token,
                tokenAuthPluginConfig.jwt.secretKey
            );
            req.tokenObj = verifyResult;
            return next();
        } else {
            return res
                .status(401)
                .send(handleError.security("the token not found"));
        }
    } catch (e) {
        let code = _.get(e, "code");
        if (code) {
            return res.status(code).send(e.operationOutcome);
        }
        return res.status(500).send(handleError.exception(e));
    }
}

async function getTokenPermission(token, resourceType, interaction) {
    try {
        let tokenInDb = await mongoose.model("issuedToken")
            .findOne({
                id: token
            })
            .exec();
        if (!tokenInDb) return false;

        let tokenObj = await verifyJWT(
            tokenInDb.token,
            tokenAuthPluginConfig.jwt.secretKey
        );
        if (tokenObj) {
            let scope = _.get(tokenObj, "scope");
            if ( scope.includes(`${resourceType}:${interaction}`) ||
                 scope.includes(`*:${interaction}`)
            ) return true;
            return false;
        }
        return false;
    } catch (e) {
        console.error(e);
        return false;
    }
}

async function checkTokenPermission(req, resourceType, interaction) {
    let token = _.get(req.headers, "authorization", false);
    token = token.replace("Bearer ", "");
    let permission = await getTokenPermission(token, resourceType, interaction);
    if (permission) {
        return true;
    } else {
        return false;
    }
}

function verifyJWT(jwtString, secretOrPublicKey, option = {}) {
    return new Promise((resolve, reject) => {
        jwt.verify(
            jwtString,
            secretOrPublicKey,
            option,
            function (err, decoded) {
                if (err) {
                    if (err.name == "TokenExpiredError") {
                        let expiredOperationOutcome =
                            handleError.expired("token expired");
                        return reject(
                            new ErrorOperationOutcome(
                                401,
                                expiredOperationOutcome
                            )
                        );
                    }
                    let securityOperationOutcome = handleError.security(
                        err.message
                    );
                    return reject(
                        new ErrorOperationOutcome(401, securityOperationOutcome)
                    );
                }
                return resolve(decoded);
            }
        );
    });
}

module.exports.checkIsLoggedIn = checkIsLoggedIn;
module.exports.tokenAuthentication = tokenAuthentication;
module.exports.getTokenPermission = getTokenPermission;
module.exports.checkTokenPermission = checkTokenPermission;
