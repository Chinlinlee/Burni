const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const uri = require('../FHIRDataTypesSchema/uri');
const base64Binary = require('../FHIRDataTypesSchema/base64Binary');

const {
    Device_UdiCarrier
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Device_UdiCarrier.add({
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
    jurisdiction: uri,
    carrierAIDC: base64Binary,
    carrierHRF: string,
    entryType: {
        type: String,
        enum: ["barcode", "rfid", "manual", "card", "self-reported", "unknown"],
        default: void 0
    }
});
module.exports.Device_UdiCarrier = Device_UdiCarrier;