const mongodb = require('../../../models/mongodb');

/**
 * 
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 */
module.exports = async function(req, res) {
    try {
        await mongodb.issuedToken.deleteOne({
            _id: req.params._id
        });
        return res.status(200).send({
            status: true,
            message: "Delete success"
        })
    } catch(e) {
        console.error(e);
        return res.status(500).send({
            status: false,
            message: e
        });
    }
    
}