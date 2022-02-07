const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const uri = require('../FHIRDataTypesSchema/uri');
const {
    Coding
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Questionnaire_EnableWhen
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const boolean = require('../FHIRDataTypesSchema/boolean');
const integer = require('../FHIRDataTypesSchema/integer');
const canonical = require('../FHIRDataTypesSchema/canonical');
const {
    Questionnaire_AnswerOption
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Questionnaire_Initial
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    Questionnaire_Item
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Questionnaire_Item.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    linkId: string,
    definition: uri,
    code: {
        type: [Coding],
        default: void 0
    },
    prefix: string,
    text: string,
    type: {
        type: String,
        enum: ["group", "display", "boolean", "decimal", "integer", "date", "dateTime", "time", "string", "text", "url", "choice", "open-choice", "attachment", "reference", "quantity"],
        default: void 0
    },
    enableWhen: {
        type: [Questionnaire_EnableWhen],
        default: void 0
    },
    enableBehavior: {
        type: String,
        enum: ["all", "any"],
        default: void 0
    },
    required: boolean,
    repeats: boolean,
    readOnly: boolean,
    maxLength: integer,
    answerValueSet: canonical,
    answerOption: {
        type: [Questionnaire_AnswerOption],
        default: void 0
    },
    initial: {
        type: [Questionnaire_Initial],
        default: void 0
    },
    item: {
        type: [this],
        default: void 0
    }
});
module.exports.Questionnaire_Item = Questionnaire_Item;