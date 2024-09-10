const path = require("path");
const winston = require("winston");
const { format } = winston;
const { combine, label, json, timestamp, errors } = format;
const procIndex = process.env.NODE_APP_INSTANCE == null ? 0 : process.env.NODE_APP_INSTANCE;

winston.loggers.add("burni", {
    level: "info",
    format: combine(
        errors({ stack: true }),
        label({ label: "burni" }),
        timestamp(),
        json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({
            filename: path.join(__dirname, `../log/burni-${procIndex}.log`),
            maxFiles: 5,
            maxSize: "10m",
            tailable: true
        })
    ]
});

winston.loggers.add("burni-http", {
    level: "http",
    format: combine(
        errors({ stack: true }),
        label({ label: "burni-http" }),
        timestamp(),
        json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({
            filename: path.join(__dirname, `../log/burni-http-${procIndex}.log`),
            maxFiles: 5,
            maxSize: "10m",
            tailable: true
        })
    ]
});

module.exports.logger = winston.loggers.get("burni");
module.exports.httpLogger = winston.loggers.get("burni-http");
