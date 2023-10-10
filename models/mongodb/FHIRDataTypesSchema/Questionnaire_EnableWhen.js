const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const boolean = require("../FHIRDataTypesSchema/boolean");
const { Coding } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Quantity
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    Questionnaire_EnableWhen
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Questionnaire_EnableWhen.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    question: string,
    operator: {
        type: String,
        enum: ["exists", "=", "!=", ">", "<", ">=", "<="],
        default: void 0
    },
    answerBoolean: boolean,
    answerDecimal: {
        type: Number,
        default: void 0
    },
    answerInteger: {
        type: Number,
        default: void 0
    },
    answerDate: string,
    answerDateTime: string,
    answerTime: string,
    answerString: string,
    answerCoding: {
        type: Coding,
        default: void 0
    },
    answerQuantity: {
        type: Quantity,
        default: void 0
    },
    answerReference: {
        type: Reference,
        default: void 0
    }
});
module.exports.Questionnaire_EnableWhen = Questionnaire_EnableWhen;
