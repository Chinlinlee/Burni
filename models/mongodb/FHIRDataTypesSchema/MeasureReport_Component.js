const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    MeasureReport_Component
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MeasureReport_Component.add({
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
    value: {
        type: CodeableConcept,
        required: true,
        default: void 0
    }
});
module.exports.MeasureReport_Component = MeasureReport_Component;