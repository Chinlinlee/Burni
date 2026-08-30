const fs = require("fs");
const _ = require("lodash");
const beautify = require("js-beautify").js;
const path = require("path");
const mkdirp = require("mkdirp");
let schemaJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, "./fhir.schema.json"), {
        encoding: "utf-8"
    })
);

let resourceList = schemaJson.definitions.ResourceList.oneOf.map((v) => {
    let itemSplit = v["$ref"].split("/");
    return itemSplit[itemSplit.length - 1];
});

let FHIRJson = schemaJson.definitions;

const outputDir = path.join(__dirname, "../models/mongodb/FHIRDataTypesSchema");

const canonicalTemporalTypes = new Set(["date", "dateTime", "instant"]);
const datePrimitiveType = ["instant", "time", "dateTime", "date"];
const skipTypes = new Set(["time"]);

function checkIsFHIRResource(resourceName) {
    return resourceList.includes(resourceName);
}

function generateCanonicalDateSchema() {
    return beautify(`const { validateCanonicalDate, toPlainCanonicalValue } = require("../../FHIR/temporal");
const { DATE_PRECISION } = require("../../FHIR/temporal/constants");

module.exports = {
    type: {
        value: { type: String, required: true },
        precision: {
            type: String,
            enum: Object.values(DATE_PRECISION),
            required: true
        },
        normalizedStart: { type: String, required: true },
        normalizedEnd: { type: String, required: true }
    },
    _id: false,
    default: void 0,
    validate: {
        validator: function (v) {
            return validateCanonicalDate(toPlainCanonicalValue(v)).valid;
        },
        message: (props) => {
            const result = validateCanonicalDate(toPlainCanonicalValue(props.value));
            return result.errors.join("; ");
        }
    }
};`);
}

function generateCanonicalDateTimeSchema() {
    return beautify(`const mongoose = require("mongoose");
const { validateCanonicalDateTime, toPlainCanonicalValue } = require("../../FHIR/temporal");
const { DATETIME_PRECISION } = require("../../FHIR/temporal/constants");

module.exports = {
    type: {
        value: { type: String, required: true },
        precision: {
            type: String,
            enum: Object.values(DATETIME_PRECISION),
            required: true
        },
        fractionDigits: { type: Number, default: void 0 },
        normalizedStart: {
            type: mongoose.Schema.Types.Decimal128,
            required: true
        },
        normalizedEnd: {
            type: mongoose.Schema.Types.Decimal128,
            required: true
        }
    },
    _id: false,
    default: void 0,
    validate: {
        validator: function (v) {
            return validateCanonicalDateTime(toPlainCanonicalValue(v)).valid;
        },
        message: (props) => {
            const result = validateCanonicalDateTime(toPlainCanonicalValue(props.value));
            return result.errors.join("; ");
        }
    }
};`);
}

function generateCanonicalInstantSchema() {
    return beautify(`const mongoose = require("mongoose");
const { validateCanonicalInstant, canonicalInstantFromUtcDate, toPlainCanonicalValue } = require("../../FHIR/temporal");
const { INSTANT_PRECISION } = require("../../FHIR/temporal/constants");

module.exports = {
    type: {
        value: { type: String, required: true },
        precision: {
            type: String,
            enum: Object.values(INSTANT_PRECISION),
            required: true
        },
        fractionDigits: { type: Number, default: void 0 },
        epochSeconds: {
            type: mongoose.Schema.Types.Decimal128,
            required: true
        }
    },
    _id: false,
    default: void 0,
    set: function (v) {
        if (v instanceof Date) {
            return canonicalInstantFromUtcDate(v);
        }
        if (typeof v === "number" && Number.isFinite(v)) {
            return canonicalInstantFromUtcDate(new Date(v));
        }
        return v;
    },
    validate: {
        validator: function (v) {
            return validateCanonicalInstant(toPlainCanonicalValue(v)).valid;
        },
        message: (props) => {
            const result = validateCanonicalInstant(toPlainCanonicalValue(props.value));
            return result.errors.join("; ");
        }
    }
};`);
}

function generateCanonicalTemporalSchema(type) {
    if (type === "date") {
        return generateCanonicalDateSchema();
    }
    if (type === "dateTime") {
        return generateCanonicalDateTimeSchema();
    }
    if (type === "instant") {
        return generateCanonicalInstantSchema();
    }
    return null;
}

function main() {
    mkdirp.sync(outputDir);
    for (let type in FHIRJson) {
        if (!checkIsFHIRResource(type) && type != "ResourceList") {
            if (/^[a-z]/.test(type) && !type.includes("_")) {
                if (skipTypes.has(type)) {
                    continue;
                }

                if (canonicalTemporalTypes.has(type)) {
                    fs.writeFileSync(
                        path.join(outputDir, `${type}.js`),
                        generateCanonicalTemporalSchema(type)
                    );
                    continue;
                }

                let primitiveType = FHIRJson[type];
                let pattern = _.get(primitiveType, "pattern");
                let typeInSchema = _.get(primitiveType, "type") || "String";
                if (datePrimitiveType.includes(type)) {
                    typeInSchema = "Date";
                }
                typeInSchema =
                    typeInSchema.substring(0, 1).toUpperCase() +
                    typeInSchema.substring(1);
                if (pattern && !datePrimitiveType.includes(type)) {
                    fs.writeFileSync(
                        path.join(outputDir, `${type}.js`),
                        beautify(`module.exports = {
                        type : ${typeInSchema} ,
                        validate : {
                            validator : function (v) {
                                return /${pattern}/.test(v);
                            } , 
                            message : props => \`\${props.value} is not a valid ${type}!\`
                        } ,
                        default : void 0
                    }`)
                    );
                } else {
                    let schema = {
                        type: typeInSchema,
                        default: "void 0",
                        get: ""
                    };
                    if (type == "date") {
                        schema.get =
                            "function (v) {return moment(v).format('YYYY-MM-DD');}";
                    } else if (type == "dateTime") {
                        schema.get =
                            "function (v) {return moment(v).format('YYYY-MM-DDThh:mm:ssZ');}";
                    } else if (type == "instant") {
                        schema.get =
                            "function (v) {return moment(v).format('YYYY-MM-DDThh:mm:ss.SSSZ');}";
                    } else if (type == "time") {
                        schema.get =
                            "function (v) {return moment(v).format('hh:mm:ss');}";
                    } else {
                        delete schema.get;
                    }

                    fs.writeFileSync(
                        path.join(outputDir, `${type}.js`),
                        beautify(`
                    const moment = require('moment');
                    module.exports = ${JSON.stringify(schema).replace(
                        /\"/gm,
                        ""
                    )}`)
                    );
                }
            }
        }
    }
}

main();
