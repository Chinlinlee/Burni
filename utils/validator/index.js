const path = require("path");
const fs = require("fs");
const { FhirValidator } = require("node-java-fhir-validator");

const validator = new FhirValidator({
    igDir: path.normalize(path.join(__dirname, "./igs"))
});

const fhirProfileFiles = fs.readdirSync(path.join(__dirname, "./igs"));
fhirProfileFiles.forEach(async (file) => {
    let extName = path.extname(file);
    if (extName === ".json") {
        let resource = fs.readFileSync(
            path.join(__dirname, "./igs", file),
            "utf8"
        );
        try {
            await validator.loadProfile(resource);
        } catch (e) {
            console.error(e);
        }
    }
});

/** @type {import("node-java-fhir-validator")} */
module.exports.validator = validator;
