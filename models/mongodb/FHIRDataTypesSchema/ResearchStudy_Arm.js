const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    ResearchStudy_Arm
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ResearchStudy_Arm.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    name: string,
    type: {
        type: CodeableConcept,
        default: void 0
    },
    description: string
});
module.exports.ResearchStudy_Arm = ResearchStudy_Arm;