const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");

const {
    DeviceDefinition_DeviceName
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
DeviceDefinition_DeviceName.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    name: string,
    type: {
        type: String,
        enum: [
            "udi-label-name",
            "user-friendly-name",
            "patient-reported-name",
            "manufacturer-name",
            "model-name",
            "other"
        ],
        default: void 0
    }
});
module.exports.DeviceDefinition_DeviceName = DeviceDefinition_DeviceName;
