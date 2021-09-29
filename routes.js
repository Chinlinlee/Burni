const fs = require('fs');

module.exports = function (app, passport) {
    app.set('json spaces', 4);
    app.use('/', require('web/index'));
    if (process.env.ENABLE_TOKEN_AUTH == "true") {
        if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
            console.error("please set ADMIN_USERNAME and ADMIN_PASSWORD in dotenv file");
            process.exit(1);
        }
        app.use('/user' , require('./api/user'));
    }
    

    //#region fhir
    let fhirDir = fs.readdirSync("./api/FHIR");
    for (let dir of fhirDir) {
        let isDir = fs.lstatSync(`./api/FHIR/${dir}`).isDirectory();
        if (isDir) {
            app.use(`/${process.env.FHIRSERVER_APIPATH}/${dir}`, require(`./api/FHIR/${dir}`));
        }
    }
    ////#endregion
    app.route('/:url(api|auth|web)/*').get((req, res) => {
        res.status(404).json({
            status: 404,
            message: "not found"
        });
    });
}