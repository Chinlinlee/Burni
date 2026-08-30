const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    MeasureReport_Population
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Quantity
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    MeasureReport_Stratifier
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    MeasureReport_Group
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MeasureReport_Group.add({
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
        default: void 0
    },
    population: {
        type: [MeasureReport_Population],
        default: void 0
    },
    measureScore: {
        type: Quantity,
        default: void 0
    },
    stratifier: {
        type: [MeasureReport_Stratifier],
        default: void 0
    }
});
module.exports.MeasureReport_Group = MeasureReport_Group;