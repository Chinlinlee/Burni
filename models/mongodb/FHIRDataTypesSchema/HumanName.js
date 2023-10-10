const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const { Period } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    HumanName
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
HumanName.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    use: {
        type: String,
        enum: [
            "usual",
            "official",
            "temp",
            "nickname",
            "anonymous",
            "old",
            "maiden"
        ],
        default: void 0
    },
    text: string,
    family: string,
    given: {
        type: [string],
        default: void 0
    },
    prefix: {
        type: [string],
        default: void 0
    },
    suffix: {
        type: [string],
        default: void 0
    },
    period: {
        type: Period,
        default: void 0
    }
});
module.exports.HumanName = HumanName;
