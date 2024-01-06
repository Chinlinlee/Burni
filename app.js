const fastify = require("fastify");
const autoLoad = require("@fastify/autoload");
const sensible = require("@fastify/sensible");
const { join } = require("path");
const underPressure = require("@fastify/under-pressure");
const cors = require("@fastify/cors");
const compress = require("@fastify/compress");
const cookie = require("@fastify/cookie");
const session = require("@fastify/session");

const { ServerEnv, FhirEnv } = require("./env-class");
const { FhirApiRegisterHelper } = require("./fhirApiRegister");

const { MongooseInstance } = require("./models/mongodb");
const mongoose = require("mongoose");
const { handleError } = require("./models/FHIR/httpMessage");
const MongoStore = require("connect-mongo")({
    session: session
});
async function buildApp(options = {}) {
    await MongooseInstance.connect();

    const app = fastify(options);

    await app.register(compress);

    await app.register(autoLoad, {
        dir: join(__dirname, "fastify-plugins")
    });

    let fhirApiRegisterHelper = new FhirApiRegisterHelper(app);
    await fhirApiRegisterHelper.registerFhirApis();
    await app.register(autoLoad, {
        dir: join(__dirname, "fastify-modules"),
        encapsulate: false,
        maxDepth: 1
    });

    await app.register(sensible);

    await app.register(underPressure, {
        maxEventLoopDelay: 1e3,
        maxHeapUsedBytes: 1e9, // Around 1GB
        maxRssBytes: 1e9,
        maxEventLoopUtilization: 0.98
    });

    await app.register(cors, {
        origin: false
    });

    await app.register(cookie);
    await app.register(session, {
        secret: ServerEnv.sessionSecretKey,
        saveUninitialized: true,
        store: new MongoStore({
            mongooseConnection: mongoose.connection
        }),
        cookie: {
            httpOnly: true,
            maxAge: 60 * 60 * 1000
        }
    });


    app.addContentTypeParser("application/fhir+json", { parseAs: "string" }, app.getDefaultJsonParser("error", "ignore"));
    app.addContentTypeParser(["text/*", "/_xml", "xml", "+xml"], { parseAs: "string" }, (req, payload, done) => {
        done(null, payload);
    });

    app.decorateRequest("get");
    app.decorateReply("set");
    app.decorateReply("append");
    app.addHook("preHandler", async function (request, reply) {
        request.get = function (headerName) {
            return request.headers?.[headerName];
        };

        reply.set = function (headerName, value) {
            return reply.header(headerName, value);
        };

        // from express: https://github.com/expressjs/express/blob/2a00da2067b7017f769c9100205a2a5f267a884b/lib/response.js#L744
        reply.append = function (headerName, value) {
            let prev = reply.header(headerName);
            let newValue = value;
            if (prev) {
                newValue = Array.isArray(prev) ? prev.concat(value) : Array.isArray(value) ? [prev].concat(value) : [prev, value];
            }

            return reply.set(headerName, newValue);
        };
    });

    app.setErrorHandler(function (error, request, reply) {
        this.log.error(error);
        if (error?.statusCode) {
            return reply.status(error.statusCode).send(error);
        }
        return reply.status(500).send(handleError.exception(error));
    });

    return app;
}


module.exports.buildApp = buildApp;
