const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Coding } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Contract_Context
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const { Period } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Contract_Answer
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const unsignedInt = require("../FHIRDataTypesSchema/unsignedInt");
const {
    Contract_ValuedItem
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    Contract_Asset
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Contract_Asset.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    scope: {
        type: CodeableConcept,
        default: void 0
    },
    type: {
        type: [CodeableConcept],
        default: void 0
    },
    typeReference: {
        type: [Reference],
        default: void 0
    },
    subtype: {
        type: [CodeableConcept],
        default: void 0
    },
    relationship: {
        type: Coding,
        default: void 0
    },
    context: {
        type: [Contract_Context],
        default: void 0
    },
    condition: string,
    periodType: {
        type: [CodeableConcept],
        default: void 0
    },
    period: {
        type: [Period],
        default: void 0
    },
    usePeriod: {
        type: [Period],
        default: void 0
    },
    text: string,
    linkId: {
        type: [string],
        default: void 0
    },
    answer: {
        type: [Contract_Answer],
        default: void 0
    },
    securityLabelNumber: {
        type: [unsignedInt],
        default: void 0
    },
    valuedItem: {
        type: [Contract_ValuedItem],
        default: void 0
    }
});
module.exports.Contract_Asset = Contract_Asset;
