const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const {
    Expression
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Measure_Component
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    Measure_Stratifier
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Measure_Stratifier.add({
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
    description: string,
    criteria: {
        type: Expression,
        default: void 0
    },
    component: {
        type: [Measure_Component],
        default: void 0
    }
});
module.exports.Measure_Stratifier = Measure_Stratifier;