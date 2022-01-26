const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const dateTime = require('../FHIRDataTypesSchema/dateTime');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const boolean = require('../FHIRDataTypesSchema/boolean');

const {
    Immunization_Reaction
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Immunization_Reaction.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    date: dateTime,
    detail: {
        type: Reference,
        default: void 0
    },
    reported: boolean
});
module.exports.Immunization_Reaction = Immunization_Reaction;