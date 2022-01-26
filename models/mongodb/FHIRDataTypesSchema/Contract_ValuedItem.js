const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Identifier
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const dateTime = require('../FHIRDataTypesSchema/dateTime');
const {
    Quantity
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Money
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const decimal = require('../FHIRDataTypesSchema/decimal');
const string = require('../FHIRDataTypesSchema/string');
const unsignedInt = require('../FHIRDataTypesSchema/unsignedInt');

const {
    Contract_ValuedItem
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Contract_ValuedItem.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    entityCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    entityReference: {
        type: Reference,
        default: void 0
    },
    identifier: {
        type: Identifier,
        default: void 0
    },
    effectiveTime: dateTime,
    quantity: {
        type: Quantity,
        default: void 0
    },
    unitPrice: {
        type: Money,
        default: void 0
    },
    factor: decimal,
    points: decimal,
    net: {
        type: Money,
        default: void 0
    },
    payment: string,
    paymentDate: dateTime,
    responsible: {
        type: Reference,
        default: void 0
    },
    recipient: {
        type: Reference,
        default: void 0
    },
    linkId: {
        type: [string],
        default: void 0
    },
    securityLabelNumber: {
        type: [unsignedInt],
        default: void 0
    }
});
module.exports.Contract_ValuedItem = Contract_ValuedItem;