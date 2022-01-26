const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const uri = require('../FHIRDataTypesSchema/uri');

const {
    Bundle_Link
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Bundle_Link.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    relation: string,
    url: uri
});
module.exports.Bundle_Link = Bundle_Link;