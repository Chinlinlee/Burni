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
    Ratio
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Duration
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    MedicinalProductPharmaceutical_TargetSpecies
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    MedicinalProductPharmaceutical_RouteOfAdministration
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MedicinalProductPharmaceutical_RouteOfAdministration.add({
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
    firstDose: {
        type: Quantity,
        default: void 0
    },
    maxSingleDose: {
        type: Quantity,
        default: void 0
    },
    maxDosePerDay: {
        type: Quantity,
        default: void 0
    },
    maxDosePerTreatmentPeriod: {
        type: Ratio,
        default: void 0
    },
    maxTreatmentPeriod: {
        type: Duration,
        default: void 0
    },
    targetSpecies: {
        type: [MedicinalProductPharmaceutical_TargetSpecies],
        default: void 0
    }
});
module.exports.MedicinalProductPharmaceutical_RouteOfAdministration = MedicinalProductPharmaceutical_RouteOfAdministration;