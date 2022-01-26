const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    MedicationKnowledge_Substitution
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    MedicationKnowledge_Schedule
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    MedicationKnowledge_MaxDispense
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    MedicationKnowledge_Regulatory
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MedicationKnowledge_Regulatory.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    regulatoryAuthority: {
        type: Reference,
        required: true,
        default: void 0
    },
    substitution: {
        type: [MedicationKnowledge_Substitution],
        default: void 0
    },
    schedule: {
        type: [MedicationKnowledge_Schedule],
        default: void 0
    },
    maxDispense: {
        type: MedicationKnowledge_MaxDispense,
        default: void 0
    }
});
module.exports.MedicationKnowledge_Regulatory = MedicationKnowledge_Regulatory;