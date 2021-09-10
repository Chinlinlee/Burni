
const jwt = require('jsonwebtoken');
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
        let token = jwt.sign(req.body , "AhKais7aij9tai7i" , {expiresIn: '1y'});
        let tokenObj = new mongodb.issuedToken({
            ...req.body ,
            token: `Bearer ${token}`
        })
        await tokenObj.save();
        return res.status(200).send(tokenObj);
    } catch(err) {
        console.error(err);
        return res.status(500).json(err);
    }
}