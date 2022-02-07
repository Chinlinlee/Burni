const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');

const {
    Device_DeviceName
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Device_DeviceName.add({
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
        enum: ["udi-label-name", "user-friendly-name", "patient-reported-name", "manufacturer-name", "model-name", "other"],
        default: void 0
    }
});
module.exports.Device_DeviceName = Device_DeviceName;