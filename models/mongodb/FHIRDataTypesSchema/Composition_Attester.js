const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const dateTime = require("../FHIRDataTypesSchema/dateTime");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    Composition_Attester
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Composition_Attester.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    mode: {
        type: String,
        enum: ["personal", "professional", "legal", "official"],
        default: void 0
    },
    time: dateTime,
    party: {
        type: Reference,
        default: void 0
    }
});
module.exports.Composition_Attester = Composition_Attester;
