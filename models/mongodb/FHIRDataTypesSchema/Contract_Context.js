const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');

const {
    Contract_Context
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Contract_Context.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    reference: {
        type: Reference,
        default: void 0
    },
    code: {
        type: [CodeableConcept],
        default: void 0
    },
    text: string
});
module.exports.Contract_Context = Contract_Context;