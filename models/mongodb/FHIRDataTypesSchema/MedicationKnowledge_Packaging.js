const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Quantity
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    MedicationKnowledge_Packaging
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MedicationKnowledge_Packaging.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    type: {
        type: CodeableConcept,
        default: void 0
    },
    quantity: {
        type: Quantity,
        default: void 0
    }
});
module.exports.MedicationKnowledge_Packaging = MedicationKnowledge_Packaging;