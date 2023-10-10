const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");

const {
    Device_Specialization
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Device_Specialization.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    systemType: {
        type: CodeableConcept,
        required: true,
        default: void 0
    },
    version: string
});
module.exports.Device_Specialization = Device_Specialization;
