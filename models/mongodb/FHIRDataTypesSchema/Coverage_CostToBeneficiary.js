const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Quantity
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Money } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Coverage_Exception
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    Coverage_CostToBeneficiary
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Coverage_CostToBeneficiary.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    type: {
        type: CodeableConcept,
        default: void 0
    },
    valueQuantity: {
        type: Quantity,
        default: void 0
    },
    valueMoney: {
        type: Money,
        default: void 0
    },
    exception: {
        type: [Coverage_Exception],
        default: void 0
    }
});
module.exports.Coverage_CostToBeneficiary = Coverage_CostToBeneficiary;
