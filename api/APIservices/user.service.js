const _ = require('lodash');
const mongodb = require('../../models/mongodb');
const jwt = require('jsonwebtoken');
const { handleError, ErrorOperationOutcome } = require('../../models/FHIR/httpMessage');
/**
 * 
 * @param {import('express').Request} req 
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns 
 */
function checkIsLoggedIn (req, res, next) {
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
        if (process.env.ENABLE_TOKEN_AUTH == "true") {
            let token = _.get(req.headers, "authorization",false);
            if (!token) {
                return res.status(400).send(handleError.security("missing authorization in headers"));
            }
            let tokenInDb = await mongodb.issuedToken.findOne({
                id: token
            });
            if (tokenInDb) {
                let verifyResult = await verifyJWT(tokenInDb.token, process.env.JWT_SECRET_KEY);
                req.tokenObj = verifyResult;
                return next();
            } else {
                return res.status(401).send(handleError.security("the token not found"));
            }
        } else {
            return next();
        }
    } catch(e) {
        let code = _.get(e, "code");
        if (code) {
            return res.status(code).send(e.operationOutcome);
        }
        return res.status(500).send(handleError.exception(e));
    }
}

async function getTokenPermission (token,resourceType, interaction) {
    try {
        let tokenInDb = await mongodb.issuedToken.findOne({
            id: token
        }).exec();
        let tokenObj = await verifyJWT(tokenInDb.token, process.env.JWT_SECRET_KEY);
        if (tokenObj) {
            let accessList = _.get(tokenObj, "accessList");
            let resourceTypeInteractionList = accessList.find(v=> v.resourceType === resourceType);
            if (resourceTypeInteractionList) {
                let permission = _.get(resourceTypeInteractionList, interaction, false);
                return permission;
            }
            return false;
        }
        return false;
    } catch(e) {
        console.error(e);
        return false;
    }
}

async function checkTokenPermission(req, resourceType, interaction) {
    if (process.env.ENABLE_TOKEN_AUTH == "true") {
        let token = _.get(req.headers, "authorization", false);
        let permission = await getTokenPermission(token, resourceType, interaction);
        if (permission) {
            return true;
        } else {
            return false;
        }
    }
    return false;
}

function verifyJWT(jwtString, secretOrPublicKey, option= {}) {
    return new Promise((resolve, reject)=> {
        jwt.verify(jwtString, secretOrPublicKey,option ,function(err, decoded) {
            if (err) {
                if (err.name == "TokenExpiredError") {
                    let expiredOperationOutcome = handleError.expired("token expired");
                    return reject(new ErrorOperationOutcome(401, expiredOperationOutcome));
                }
                let securityOperationOutcome = handleError.security(err.message);
                return reject(new ErrorOperationOutcome(401, securityOperationOutcome));
            } 
            return resolve(decoded);
        });
    });
}


module.exports.checkIsLoggedIn = checkIsLoggedIn;
module.exports.tokenAuthentication = tokenAuthentication;
module.exports.getTokenPermission = getTokenPermission;
module.exports.checkTokenPermission = checkTokenPermission;