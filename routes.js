const path = require("path");
const fs = require('fs');
const _ = require("lodash");
const {
    handleError
} = require('./models/FHIR/httpMessage');
const FHIR = require('fhir').Fhir;
let pluginsConfig;
if (fs.existsSync(path.join(__dirname, "./plugins/config.js"))) {
    pluginsConfig = require("./plugins/config").pluginsConfig;
} else {
    pluginsConfig = require("./plugins/config.template").pluginsConfig;
}

function setFormatWhenQuery(req, res) {
    let format = _.get(req, "query._format");
    if (format && format.includes("xml")) {
        res.set("Content-Type", "application/fhir+xml");
    } else if (format && format.includes("json")) {
        res.set("Content-Type", "application/fhir+json");
    }
    delete req["query"]["_format"];
}

function doPrettyJson(app, req) {
    let pretty = _.get(req, "query._pretty", false);
    if (pretty === "true") {
        app.set("json spaces", 4);
    } else {
        app.set("json spaces", 0);
    }
}

module.exports = function (app) {
    app.set("json spaces", 4);

    //#region fhir
    let fhirDir = fs.readdirSync("./api/FHIR");
    for (let dir of fhirDir) {
        let isDir = fs.lstatSync(`./api/FHIR/${dir}`).isDirectory();
        if (isDir) {
            app.use(
                `/${process.env.FHIRSERVER_APIPATH}/${dir}`,
                (req, res, next) => {
                    try {
                        // default JSON format
                        res.set("Content-Type", "application/fhir+json");

                        if (req.headers["content-type"]) {
                            if (req.headers["content-type"].includes("xml")) {
                                res.set("Content-Type", "application/fhir+xml");
                                if (
                                    req.method == "POST" ||
                                    req.method == "PUT"
                                ) {
                                    let Fhir = new FHIR();
                                    req.body = Fhir.xmlToObj(req.body);
                                }
                            }
                        }
                        _.get(req.headers, "accept")
                            ? ""
                            : (() => {
                                _.get(req.headers, "content-type")
                                    ? _.set(
                                        req.headers,
                                        "accept",
                                        _.get(req.headers, "content-type")
                                    )
                                    : _.set(
                                        req.headers,
                                        "accept",
                                        "application/fhir+json"
                                    );
                            })();

                        let xmlAcceptList = [
                            "application/xml",
                            "application/fhir+xml",
                            "xml"
                        ];

                        for(let i = 0 ; i< xmlAcceptList.length ; i++) {
                            let xmlAccept = xmlAcceptList[i];
                            if (req.headers.accept.includes(xmlAccept)) {
                                res.set("Content-Type", "application/fhir+xml");
                            } else {
                                res.set("Content-Type", "application/fhir+json");
                            }
                        }
                        
                        setFormatWhenQuery(req, res);
                        doPrettyJson(app, req);
                        next();
                    } catch (e) {
                        return res.send(handleError.exception(e));
                    }
                }
            );
        }
    }

    app.post(`/${process.env.FHIRSERVER_APIPATH}`, require("./api/FHIRApiService/root"));
    //#endregion

    for (let pluginName in pluginsConfig) {
        let plugin = pluginsConfig[pluginName];
        if (plugin.before && plugin.enable)
            require(`plugins/${pluginName}`)(app);
    }

    app.use("/", require("web/index"));

    //#region fhir
    for (let dir of fhirDir) {
        let isDir = fs.lstatSync(`./api/FHIR/${dir}`).isDirectory();
        if (isDir) {
            app.use(
                `/${process.env.FHIRSERVER_APIPATH}/${dir}`,
                require(`./api/FHIR/${dir}`)
            );
        }
    }
    //#endregion
    app.route("/:url(api|auth|web)/*").get((req, res) => {
        res.status(404).json({
            status: 404,
            message: "not found"
        });
    });

    for (let pluginName in pluginsConfig) {
        let plugin = pluginsConfig[pluginName];
        if (!plugin.before && plugin.enable)
            require(`plugins/${pluginName}`)(app);
    }
};
