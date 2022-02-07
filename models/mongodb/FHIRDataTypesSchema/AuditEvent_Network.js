const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');

const {
    AuditEvent_Network
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
AuditEvent_Network.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    address: string,
    type: {
        type: String,
        enum: ["1", "2", "3", "4", "5"],
        default: void 0
    }
});
module.exports.AuditEvent_Network = AuditEvent_Network;