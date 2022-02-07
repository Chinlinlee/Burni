const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const boolean = require('../FHIRDataTypesSchema/boolean');
const {
    Period
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    NamingSystem_UniqueId
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
NamingSystem_UniqueId.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    type: {
        type: String,
        enum: ["oid", "uuid", "uri", "other"],
        default: void 0
    },
    value: string,
    preferred: boolean,
    comment: string,
    period: {
        type: Period,
        default: void 0
    }
});
module.exports.NamingSystem_UniqueId = NamingSystem_UniqueId;