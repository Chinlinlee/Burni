const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const code = require('../FHIRDataTypesSchema/code');
const integer = require('../FHIRDataTypesSchema/integer');
const string = require('../FHIRDataTypesSchema/string');
const canonical = require('../FHIRDataTypesSchema/canonical');

const {
    ParameterDefinition
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ParameterDefinition.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    name: code,
    use: code,
    min: integer,
    max: string,
    documentation: string,
    type: code,
    profile: canonical
});
module.exports.ParameterDefinition = ParameterDefinition;