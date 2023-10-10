const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const boolean = require("../FHIRDataTypesSchema/boolean");
const string = require("../FHIRDataTypesSchema/string");
const {
    Attachment
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Coding } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Quantity
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    QuestionnaireResponse_Item
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    QuestionnaireResponse_Answer
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
QuestionnaireResponse_Answer.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    valueBoolean: boolean,
    valueDecimal: {
        type: Number,
        default: void 0
    },
    valueInteger: {
        type: Number,
        default: void 0
    },
    valueDate: string,
    valueDateTime: string,
    valueTime: string,
    valueString: string,
    valueUri: string,
    valueAttachment: {
        type: Attachment,
        default: void 0
    },
    valueCoding: {
        type: Coding,
        default: void 0
    },
    valueQuantity: {
        type: Quantity,
        default: void 0
    },
    valueReference: {
        type: Reference,
        default: void 0
    },
    item: {
        type: [QuestionnaireResponse_Item],
        default: void 0
    }
});
module.exports.QuestionnaireResponse_Answer = QuestionnaireResponse_Answer;
