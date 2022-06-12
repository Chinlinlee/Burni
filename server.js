const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const compress = require('compression');
const { handleError } = require('./models/FHIR/httpMessage');
//login
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const mongodb = require('./models/mongodb');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo')({
    session: session
});
//
require('dotenv').config();
const port = process.env.SERVER_PORT;
const app = express();

require('rootpath')();
require('dotenv').config();
app.use(compress());
app.use(flash());
app.use(express.static('public'));
app.use(express.urlencoded({
    extended: true
}));
app.use(express.json({
    "limit": "50mb"
}));
app.use(express.json({
    "type": "application/fhir+json",
    "limit": "50mb"
}));
app.use(express.text({
    "type": ["text/*", "/_xml", "xml", "+xml"]
}));

app.use((err, req, res, next) => {
    // This check makes sure this is a JSON parsing issue, but it might be
    // coming from any middleware, not just body-parser:

    // if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    //     console.error(err);
    //     return res.sendStatus(400); // Bad request
    // }
    if (err) {
        console.error(err);
        return res.status(400).send(handleError.processing(err));
    }

    next();
});

app.use(cookieParser());
//login
app.use(session({
    secret: process.env.SERVER_SESSION_SECRET_KEY || 'secretKey',
    resave: true,
    saveUninitialized: true,
    store: new MongoStore({
        mongooseConnection: mongoose.connection
    }),
    cookie: {
        httpOnly: true,
        maxAge: 60 * 60 * 1000
    }
}));
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept ,Authorization");
    res.header("Vary", "Origin");
    res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE");
    res.header("Access-Control-Allow-Credentials", "true");
    next();
});

//login
require("routes.js")(app);
app.engine('html', require('ejs').renderFile);
//
http.createServer(app).listen(port, function() {
    console.log(`http server is listening on port:${port}`);
});

module.exports = app;