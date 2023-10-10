const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    Procedure_FocalDevice
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Procedure_FocalDevice.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    action: {
        type: CodeableConcept,
        default: void 0
    },
    manipulated: {
        type: Reference,
        required: true,
        default: void 0
    }
});
module.exports.Procedure_FocalDevice = Procedure_FocalDevice;
