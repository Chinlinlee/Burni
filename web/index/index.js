const express = require("express");
const router = express.Router();

router.get("/", function (req, res) {
    if (process.env.ADMIN_LOGIN_PATH) {
        res.redirect(process.env.ADMIN_LOGIN_PATH);
    } else {
        res.sendFile("index.html", {
            root: __dirname + "../../../public/html"
        });
    }
});

module.exports = router;
