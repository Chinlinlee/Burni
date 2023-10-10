const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Identifier
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Contract_Party
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Contract_Answer
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const unsignedInt = require("../FHIRDataTypesSchema/unsignedInt");

const {
    Contract_Offer
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Contract_Offer.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    identifier: {
        type: [Identifier],
        default: void 0
    },
    party: {
        type: [Contract_Party],
        default: void 0
    },
    topic: {
        type: Reference,
        default: void 0
    },
    type: {
        type: CodeableConcept,
        default: void 0
    },
    decision: {
        type: CodeableConcept,
        default: void 0
    },
    decisionMode: {
        type: [CodeableConcept],
        default: void 0
    },
    answer: {
        type: [Contract_Answer],
        default: void 0
    },
    text: string,
    linkId: {
        type: [string],
        default: void 0
    },
    securityLabelNumber: {
        type: [unsignedInt],
        default: void 0
    }
});
module.exports.Contract_Offer = Contract_Offer;
