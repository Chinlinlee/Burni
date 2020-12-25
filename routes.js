const fs = require('fs');

module.exports = function (app, passport) {
    app.set('json spaces', 4);
    app.use('/', require('web/index'));


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