const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    ResearchStudy_Objective
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ResearchStudy_Objective.add({
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
    }
});
module.exports.ResearchStudy_Objective = ResearchStudy_Objective;