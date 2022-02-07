const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const uri = require('../FHIRDataTypesSchema/uri');
const {
    Identifier
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Reference.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    reference: string,
    type: uri,
    identifier: {
        type: Identifier,
        default: void 0
    },
    display: string
});
module.exports.Reference = Reference;