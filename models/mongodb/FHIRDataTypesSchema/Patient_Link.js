const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    Patient_Link
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Patient_Link.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    other: {
        type: Reference,
        required: true,
        default: void 0
    },
    type: {
        type: String,
        enum: ["replaced-by", "replaces", "refer", "seealso"],
        default: void 0
    }
});
module.exports.Patient_Link = Patient_Link;
