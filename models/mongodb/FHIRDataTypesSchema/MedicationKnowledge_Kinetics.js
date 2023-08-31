const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Quantity
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Duration
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    MedicationKnowledge_Kinetics
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MedicationKnowledge_Kinetics.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    areaUnderCurve: {
        type: [Quantity],
        default: void 0
    },
    lethalDose50: {
        type: [Quantity],
        default: void 0
    },
    halfLifePeriod: {
        type: Duration,
        default: void 0
    }
});
module.exports.MedicationKnowledge_Kinetics = MedicationKnowledge_Kinetics;
