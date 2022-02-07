const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    Condition_Stage
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Condition_Stage.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    summary: {
        type: CodeableConcept,
        default: void 0
    },
    assessment: {
        type: [Reference],
        default: void 0
    },
    type: {
        type: CodeableConcept,
        default: void 0
    }
});
module.exports.Condition_Stage = Condition_Stage;