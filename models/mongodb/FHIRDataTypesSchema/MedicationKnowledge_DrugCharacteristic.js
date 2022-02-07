const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const {
    Quantity
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    MedicationKnowledge_DrugCharacteristic
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MedicationKnowledge_DrugCharacteristic.add({
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
    valueCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    valueString: string,
    valueQuantity: {
        type: Quantity,
        default: void 0
    },
    valueBase64Binary: string
});
module.exports.MedicationKnowledge_DrugCharacteristic = MedicationKnowledge_DrugCharacteristic;