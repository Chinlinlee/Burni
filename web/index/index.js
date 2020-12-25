
const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/', function (req, res) {
    res.sendFile('index.html', {
        root: __dirname + '../../../public/html'
    });
});


module.exports = router;