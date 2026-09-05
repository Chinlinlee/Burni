"use strict";

const http = require("http");

/**
 * @param {import("express").Express} app
 * @param {Object} [options]
 * @returns {Promise<import("http").Server | void>}
 */
async function startServer(app, options = {}) {
    const readyPromise =
        options.readyPromise ??
        (options.mongodbModule ?? require("../models/mongodb")).ready;
    const listen =
        options.listen ??
        ((port, callback) => http.createServer(app).listen(port, callback));
    const exitProcess = options.exitProcess ?? ((code) => process.exit(code));
    const portToUse = options.port ?? process.env.SERVER_PORT;

    try {
        await readyPromise;
        if (options.configureMiddleware) {
            options.configureMiddleware();
        } else if (typeof options.configureDatabaseDependentMiddleware === "function") {
            options.configureDatabaseDependentMiddleware();
        } else {
            throw new Error("configureDatabaseDependentMiddleware is required");
        }

        return await new Promise((resolve, reject) => {
            let server;
            server = listen(portToUse, (error) => {
                if (error) {
                    reject(error);
                    return;
                }
                console.log(`http server is listening on port:${portToUse}`);
                resolve(server);
            });
            if (options.onListen) {
                options.onListen(server);
            }
        });
    } catch (err) {
        console.error("[server] application readiness failed:", err);
        if (options.throwOnFailure) {
            throw err;
        }
        exitProcess(1);
    }
}

module.exports = {
    startServer
};
