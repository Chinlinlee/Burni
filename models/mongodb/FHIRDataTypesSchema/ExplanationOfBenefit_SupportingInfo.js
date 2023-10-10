const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const positiveInt = require("../FHIRDataTypesSchema/positiveInt");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const { Period } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const boolean = require("../FHIRDataTypesSchema/boolean");
const {
    Quantity
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Attachment
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Coding } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    ExplanationOfBenefit_SupportingInfo
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ExplanationOfBenefit_SupportingInfo.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    sequence: positiveInt,
    category: {
        type: CodeableConcept,
        required: true,
        default: void 0
    },
    code: {
        type: CodeableConcept,
        default: void 0
    },
    timingDate: string,
    timingPeriod: {
        type: Period,
        default: void 0
    },
    valueBoolean: boolean,
    valueString: string,
    valueQuantity: {
        type: Quantity,
        default: void 0
    },
    valueAttachment: {
        type: Attachment,
        default: void 0
    },
    valueReference: {
        type: Reference,
        default: void 0
    },
    reason: {
        type: Coding,
        default: void 0
    }
});
module.exports.ExplanationOfBenefit_SupportingInfo =
    ExplanationOfBenefit_SupportingInfo;
