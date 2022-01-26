const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const {
    Coding
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const boolean = require('../FHIRDataTypesSchema/boolean');

const {
    Questionnaire_AnswerOption
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Questionnaire_AnswerOption.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    valueInteger: {
        type: Number,
        default: void 0
    },
    valueDate: string,
    valueTime: string,
    valueString: string,
    valueCoding: {
        type: Coding,
        default: void 0
    },
    valueReference: {
        type: Reference,
        default: void 0
    },
    initialSelected: boolean
});
module.exports.Questionnaire_AnswerOption = Questionnaire_AnswerOption;