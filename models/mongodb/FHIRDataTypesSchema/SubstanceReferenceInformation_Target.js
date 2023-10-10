const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Identifier
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Quantity
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Range } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    SubstanceReferenceInformation_Target
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
SubstanceReferenceInformation_Target.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    target: {
        type: Identifier,
        default: void 0
    },
    type: {
        type: CodeableConcept,
        default: void 0
    },
    interaction: {
        type: CodeableConcept,
        default: void 0
    },
    organism: {
        type: CodeableConcept,
        default: void 0
    },
    organismType: {
        type: CodeableConcept,
        default: void 0
    },
    amountQuantity: {
        type: Quantity,
        default: void 0
    },
    amountRange: {
        type: Range,
        default: void 0
    },
    amountString: string,
    amountType: {
        type: CodeableConcept,
        default: void 0
    },
    source: {
        type: [Reference],
        default: void 0
    }
});
module.exports.SubstanceReferenceInformation_Target =
    SubstanceReferenceInformation_Target;
