"use strict";
const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
const fs = require("fs");
const path = require("path");
const basename = path.basename(module.filename);
module.exports = exports = function (config) {
    const id = config.MONGODB_USER;
    const pwd = config.MONGODB_PASSWORD;
    const dbName = config.MONGODB_NAME;
    const authDB = config.MONGODB_AUTH_DB;
    const collection = {};
    let databaseUrl = getConnectionUrl(config);
    console.log(databaseUrl);

    let opts = {};
    if (!config.MONGODB_CONNECTION_URL) {
        opts = {
            authSource: authDB,
            auth: {
                authSource: authDB,
                username: id,
                password: pwd
            }
        };
    }

    mongoose
        .connect(databaseUrl, opts)
        .then(() => {
            if (process.env.MONGODB_IS_SHARDING_MODE == "true") {
                mongoose.connection.db
                    .admin()
                    .command({
                        enableSharding: dbName
                    })
                    .then((res) => {
                        console.log(`sharding database ${dbName} successfully`);
                        shardCollection("/model");
                        shardCollection("/staticModel");
                    })
                    .catch((err) => {
                        console.error(err);
                    });
            }
        })
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });

    const db = mongoose.connection;
    db.on("error", console.error.bind(console, "connection error:"));
    db.once("open", function () {
        console.log("we're connected!");
        const { reloadRegistry } = require("../FHIR/searchParameter/registry/registryManager");
        reloadRegistry().catch((error) => {
            console.error("Failed to preload SearchParameter registry", error);
        });
    });
    getCollections("/model", collection);
    getCollections("/staticModel", collection);

    return collection;
};

function getCollections(dirname, collectionObj) {
    let jsFilesInDir = fs
        .readdirSync(__dirname + dirname)
        .filter(
            (file) =>
                file.indexOf(".") !== 0 &&
                file !== basename &&
                file.slice(-3) === ".js"
        );
    for (let file of jsFilesInDir) {
        const moduleName = file.split(".")[0];
        console.log("moduleName :: ", moduleName);
        console.log("path : ", __dirname + dirname);
        collectionObj[moduleName] = require(
            __dirname + dirname + "/" + moduleName
        )(mongoose);
    }
}

function shardCollection(dirname) {
    let jsFilesInDir = fs
        .readdirSync(__dirname + dirname)
        .filter(
            (file) =>
                file.indexOf(".") !== 0 &&
                file !== basename &&
                file.slice(-3) === ".js"
        );
    for (let file of jsFilesInDir) {
        const moduleName = file.split(".")[0];
        if (process.env.MONGODB_IS_SHARDING_MODE == "true") {
            mongoose.connection.db
                .admin()
                .command({
                    shardCollection: `${process.env.MONGODB_NAME}.${moduleName}`,
                    key: { id: "hashed" }
                })
                .then((res) => {
                    console.log(
                        `sharding collection ${moduleName} successfully`
                    );
                })
                .catch((err) => {
                    console.error(err);
                });
        }
    }
}

function getConnectionUrl(config) {

    if (config.MONGODB_CONNECTION_URL) {
        return config.MONGODB_CONNECTION_URL;
    }

    const hosts = JSON.parse(config.MONGODB_HOSTS);
    const ports = JSON.parse(config.MONGODB_PORTS);
    const dbName = config.MONGODB_NAME;
    let databaseUrl = "";

    hosts.forEach((host, index) => {
        if (index == 0) {
            databaseUrl += `${process.env.MONGODB_PROTOCOL || "mongodb://"}${host}:${ports[0]}`;
        } else {
            databaseUrl += `,${host}:${ports[index]}`;
        }
    });
    databaseUrl += `/${dbName}`;

    return databaseUrl;
}
