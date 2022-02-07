const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const uri = require('../FHIRDataTypesSchema/uri');
const {
    QuestionnaireResponse_Answer
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    QuestionnaireResponse_Item
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
QuestionnaireResponse_Item.add({
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
    text: string,
    answer: {
        type: [QuestionnaireResponse_Answer],
        default: void 0
    },
    item: {
        type: [this],
        default: void 0
    }
});
module.exports.QuestionnaireResponse_Item = QuestionnaireResponse_Item;