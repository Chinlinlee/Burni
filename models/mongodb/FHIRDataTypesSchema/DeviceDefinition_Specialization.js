const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");

const {
    DeviceDefinition_Specialization
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
DeviceDefinition_Specialization.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    systemType: string,
    version: string
});
module.exports.DeviceDefinition_Specialization =
    DeviceDefinition_Specialization;
