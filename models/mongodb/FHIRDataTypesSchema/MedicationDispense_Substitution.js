const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const boolean = require('../FHIRDataTypesSchema/boolean');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    MedicationDispense_Substitution
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MedicationDispense_Substitution.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    wasSubstituted: boolean,
    type: {
        type: CodeableConcept,
        default: void 0
    },
    reason: {
        type: [CodeableConcept],
        default: void 0
    },
    responsibleParty: {
        type: [Reference],
        default: void 0
    }
});
module.exports.MedicationDispense_Substitution = MedicationDispense_Substitution;