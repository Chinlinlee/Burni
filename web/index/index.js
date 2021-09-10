
const express = require('express');
const router = express.Router();
const path = require('path');
const { user } = require('../../api/apiService');


router.get('/', function (req, res) {
    res.sendFile('index.html', {
        root: __dirname + '../../../public/html'
    });
});

router.get(`/${process.env.ADMIN_LOGIN_PATH}`, function(req, res) {
    res.sendFile('login.html' , {
        root: __dirname + '../../../public/html'
    })
});

router.get('/tokenIssuer', user.checkIsLoggedIn, function (req, res, next) {
    if (req.user !== process.env.ADMIN_USERNAME) {
        return res.status(403).send();
    }
    next();
}, function(req , res) {
    res.sendFile('tokenIssuer.html', {
        root: __dirname + '../../../public/html'
    });
});

router.get('/tokenManager', user.checkIsLoggedIn, function (req, res, next) {
    if (req.user !== process.env.ADMIN_USERNAME) {
        return res.status(403).send();
    }
    next();
}, function(req , res) {
    res.sendFile('tokenManager.html', {
        root: __dirname + '../../../public/html'
    });
})

module.exports = router;