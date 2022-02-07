const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Quantity
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Ratio
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    MedicationAdministration_Dosage
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MedicationAdministration_Dosage.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    text: string,
    site: {
        type: CodeableConcept,
        default: void 0
    },
    route: {
        type: CodeableConcept,
        default: void 0
    },
    method: {
        type: CodeableConcept,
        default: void 0
    },
    dose: {
        type: Quantity,
        default: void 0
    },
    rateRatio: {
        type: Ratio,
        default: void 0
    },
    rateQuantity: {
        type: Quantity,
        default: void 0
    }
});
module.exports.MedicationAdministration_Dosage = MedicationAdministration_Dosage;