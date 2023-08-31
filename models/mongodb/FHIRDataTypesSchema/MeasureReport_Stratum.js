const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    MeasureReport_Component
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    MeasureReport_Population1
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Quantity
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    MeasureReport_Stratum
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MeasureReport_Stratum.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    value: {
        type: CodeableConcept,
        default: void 0
    },
    component: {
        type: [MeasureReport_Component],
        default: void 0
    },
    population: {
        type: [MeasureReport_Population1],
        default: void 0
    },
    measureScore: {
        type: Quantity,
        default: void 0
    }
});
module.exports.MeasureReport_Stratum = MeasureReport_Stratum;
