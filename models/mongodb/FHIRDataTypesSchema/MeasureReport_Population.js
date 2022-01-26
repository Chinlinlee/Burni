const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const integer = require('../FHIRDataTypesSchema/integer');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    MeasureReport_Population
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MeasureReport_Population.add({
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
    count: integer,
    subjectResults: {
        type: Reference,
        default: void 0
    }
});
module.exports.MeasureReport_Population = MeasureReport_Population;