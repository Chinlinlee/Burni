const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Identifier
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const date = require('../FHIRDataTypesSchema/date');
const {
    Money
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    PaymentReconciliation_Detail
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
PaymentReconciliation_Detail.add({
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
    predecessor: {
        type: Identifier,
        default: void 0
    },
    type: {
        type: CodeableConcept,
        required: true,
        default: void 0
    },
    request: {
        type: Reference,
        default: void 0
    },
    submitter: {
        type: Reference,
        default: void 0
    },
    response: {
        type: Reference,
        default: void 0
    },
    date: date,
    responsible: {
        type: Reference,
        default: void 0
    },
    payee: {
        type: Reference,
        default: void 0
    },
    amount: {
        type: Money,
        default: void 0
    }
});
module.exports.PaymentReconciliation_Detail = PaymentReconciliation_Detail;