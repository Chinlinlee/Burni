require("module-alias")();
const mongoose = require("mongoose");

const { buildApp } = require("./app");
const closeWithGrace = require("close-with-grace");
const { ServerEnv, FhirEnv } = require("./env-class");

/** @type {import("fastify").FastifyServerOptions} */
const appOptions = {
    logger: {
        level: "info"
    },
    bodyLimit: 50 * 1024 * 1024 // 50mb
};


// 我們希望只有在有人監看(開發)時才使用 pino-pretty
// 否則我們將以換行分隔的 JSON 形式進行記錄，以便輸入至 log 專用的 tool
if (process.stdout.isTTY) {
    appOptions.logger.transport = {
        target: "pino-pretty"
    };
}

(async () => {
    const app = await buildApp(appOptions);
    // console.log(app.printRoutes());
    
    await app.listen({
        port: ServerEnv.port
    });
    
    if (FhirEnv.enableValidator) {
        let waitDbConnection = setInterval(() => {
            if (mongoose.connection.readyState === 1) {
                require("./utils/validator").validator;
                clearInterval(waitDbConnection);
            } else {
                console.log("validator is waiting for DB connecting...");
            }
        }, 250);
    }

    closeWithGrace(async ({ err }) => {
        if (err) {
            app.log.error({ err }, "server close due to error");
        }
        app.log.info("shutting down server gracefully");
        await app.close();
    });
})();




