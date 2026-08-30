const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    MeasureReport_Stratum
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    MeasureReport_Stratifier
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MeasureReport_Stratifier.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    code: {
        type: [CodeableConcept],
        default: void 0
    },
    stratum: {
        type: [MeasureReport_Stratum],
        default: void 0
    }
});
module.exports.MeasureReport_Stratifier = MeasureReport_Stratifier;