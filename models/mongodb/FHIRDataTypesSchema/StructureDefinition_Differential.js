const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    ElementDefinition
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    StructureDefinition_Differential
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
StructureDefinition_Differential.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    element: {
        type: [ElementDefinition],
        required: true,
        default: void 0
    }
});
module.exports.StructureDefinition_Differential = StructureDefinition_Differential;