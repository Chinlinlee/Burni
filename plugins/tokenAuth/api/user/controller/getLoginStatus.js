/**
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
module.exports = function (req, res) {
    return res.status(200).send(req.user);
};
