const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Identifier
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const dateTime = require('../FHIRDataTypesSchema/dateTime');
const {
    Period
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const {
    Contract_SecurityLabel
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Contract_Offer
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Contract_Asset
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Contract_Action
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    Contract_Term
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Contract_Term.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    identifier: {
        type: Identifier,
        default: void 0
    },
    issued: dateTime,
    applies: {
        type: Period,
        default: void 0
    },
    topicCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    topicReference: {
        type: Reference,
        default: void 0
    },
    type: {
        type: CodeableConcept,
        default: void 0
    },
    subType: {
        type: CodeableConcept,
        default: void 0
    },
    text: string,
    securityLabel: {
        type: [Contract_SecurityLabel],
        default: void 0
    },
    offer: {
        type: Contract_Offer,
        required: true,
        default: void 0
    },
    asset: {
        type: [Contract_Asset],
        default: void 0
    },
    action: {
        type: [Contract_Action],
        default: void 0
    },
    group: {
        type: [this],
        default: void 0
    }
});
module.exports.Contract_Term = Contract_Term;