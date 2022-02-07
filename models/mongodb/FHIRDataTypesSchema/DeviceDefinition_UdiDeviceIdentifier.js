const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const uri = require('../FHIRDataTypesSchema/uri');

const {
    DeviceDefinition_UdiDeviceIdentifier
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
DeviceDefinition_UdiDeviceIdentifier.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    deviceIdentifier: string,
    issuer: uri,
    jurisdiction: uri
});
module.exports.DeviceDefinition_UdiDeviceIdentifier = DeviceDefinition_UdiDeviceIdentifier;