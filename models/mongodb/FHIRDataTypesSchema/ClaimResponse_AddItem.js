const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const positiveInt = require('../FHIRDataTypesSchema/positiveInt');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const {
    Period
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Address
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Quantity
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Money
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const decimal = require('../FHIRDataTypesSchema/decimal');
const {
    ClaimResponse_Adjudication
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    ClaimResponse_Detail1
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    ClaimResponse_AddItem
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ClaimResponse_AddItem.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    itemSequence: {
        type: [positiveInt],
        default: void 0
    },
    detailSequence: {
        type: [positiveInt],
        default: void 0
    },
    subdetailSequence: {
        type: [positiveInt],
        default: void 0
    },
    provider: {
        type: [Reference],
        default: void 0
    },
    productOrService: {
        type: CodeableConcept,
        required: true,
        default: void 0
    },
    modifier: {
        type: [CodeableConcept],
        default: void 0
    },
    programCode: {
        type: [CodeableConcept],
        default: void 0
    },
    servicedDate: string,
    servicedPeriod: {
        type: Period,
        default: void 0
    },
    locationCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    locationAddress: {
        type: Address,
        default: void 0
    },
    locationReference: {
        type: Reference,
        default: void 0
    },
    quantity: {
        type: Quantity,
        default: void 0
    },
    unitPrice: {
        type: Money,
        default: void 0
    },
    factor: decimal,
    net: {
        type: Money,
        default: void 0
    },
    bodySite: {
        type: CodeableConcept,
        default: void 0
    },
    subSite: {
        type: [CodeableConcept],
        default: void 0
    },
    noteNumber: {
        type: [positiveInt],
        default: void 0
    },
    adjudication: {
        type: [ClaimResponse_Adjudication],
        required: true,
        default: void 0
    },
    detail: {
        type: [ClaimResponse_Detail1],
        default: void 0
    }
});
module.exports.ClaimResponse_AddItem = ClaimResponse_AddItem;