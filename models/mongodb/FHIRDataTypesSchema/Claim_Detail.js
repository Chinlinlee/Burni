const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const positiveInt = require("../FHIRDataTypesSchema/positiveInt");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Quantity
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Money } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const decimal = require("../FHIRDataTypesSchema/decimal");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Claim_SubDetail
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    Claim_Detail
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Claim_Detail.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    sequence: positiveInt,
    revenue: {
        type: CodeableConcept,
        default: void 0
    },
    category: {
        type: CodeableConcept,
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
    udi: {
        type: [Reference],
        default: void 0
    },
    subDetail: {
        type: [Claim_SubDetail],
        default: void 0
    }
});
module.exports.Claim_Detail = Claim_Detail;
