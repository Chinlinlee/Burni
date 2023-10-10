const fs = require("fs");
const _ = require("lodash");
const resourceTypeList = require("../models/FHIR/resourceType");
const path = require("path");

(() => {
    let allResourceConfig = {};
    for (let resourceType of resourceTypeList) {
        _.set(allResourceConfig, `${resourceType}.interaction`, {
            read: true,
            vread: true,
            update: true,
            delete: true,
            history: true,
            create: true,
            search: true
        });
    }
    fs.writeFileSync(
        path.join(__dirname, "config.js"),
        `module.exports=${JSON.stringify(allResourceConfig, null, 4)}`
    );
})();
