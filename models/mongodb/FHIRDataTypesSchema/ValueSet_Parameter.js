const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const boolean = require('../FHIRDataTypesSchema/boolean');

const {
    ValueSet_Parameter
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ValueSet_Parameter.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    name: string,
    valueString: string,
    valueBoolean: boolean,
    valueInteger: {
        type: Number,
        default: void 0
    },
    valueDecimal: {
        type: Number,
        default: void 0
    },
    valueUri: string,
    valueCode: string,
    valueDateTime: string
});
module.exports.ValueSet_Parameter = ValueSet_Parameter;