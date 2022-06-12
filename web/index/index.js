const express = require('express');
const router = express.Router();

router.get('/', function (req, res) {
    res.sendFile('index.html', {
        root: __dirname + '../../../public/html'
    });
});

module.exports = router;