const express = require('express');
const Joi = require('joi');
const router = express.Router();
const user = require('./service/user.service');
const { validateParams } = require('../../../../api/validator');
const resourceTypeList = require('../../../../models/FHIR/resourceType');

router.post('/adminLogin', function (req , res , next) {
    let passport = require('passport');
    passport.authenticate('admin-login', function (err, userObj, info) {
        if (err) { return next(err); }
        if (!userObj) { 
            return res.status(401).json(info);
        }
        req.logIn(userObj, function (err) {
            // Should not cause any errors
            if (err) { return next(err); }
            return res.json(userObj);
        });
    })(req, res, next);
    //next(new Error("missing username or password"));
});

router.get('/loginStatus' , user.checkIsLoggedIn, require('./controller/getLoginStatus'));

router.post('/token/issue', user.checkIsLoggedIn, validateParams({
    accessList: Joi.array().single().items(Joi.object().keys({
        resourceType: Joi.string().valid(...resourceTypeList),
        read: Joi.boolean().default(false),
        vread: Joi.boolean().default(false),
        create: Joi.boolean().default(false),
        update: Joi.boolean().default(false),
        "search-type": Joi.boolean().default(false),
        history: Joi.boolean().default(false),
        delete: Joi.boolean().default(false)
    }).min(1)).required(),
    tokenName: Joi.string().required(),
    tokenNote: Joi.string()
}, "body" , {
    allowUnknown: false
}) , require('./controller/postTokenIssue'));

router.get(
    '/token', 
    user.checkIsLoggedIn,
    validateParams({
    "_offset": Joi.number().integer(),
    "_count": Joi.number().integer()
    }, "query" , {allowUnknown: false}),
    require('./controller/getIssuedToken'));

router.delete(
    '/token/:_id' , 
    user.checkIsLoggedIn,
    require('./controller/deleteToken'));

router.post(
    '/token/refresh',
    validateParams({
        "refresh_token": Joi.string().required()
    }, "body" , { allowUnknown: false }),
    require("./controller/postRefreshToken")
);


module.exports = router;
