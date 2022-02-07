const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    MedicinalProductPharmaceutical_Characteristics
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MedicinalProductPharmaceutical_Characteristics.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    code: {
        type: CodeableConcept,
        required: true,
        default: void 0
    },
    status: {
        type: CodeableConcept,
        default: void 0
    }
});
module.exports.MedicinalProductPharmaceutical_Characteristics = MedicinalProductPharmaceutical_Characteristics;