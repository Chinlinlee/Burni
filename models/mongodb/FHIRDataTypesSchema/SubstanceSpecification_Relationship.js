const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const boolean = require("../FHIRDataTypesSchema/boolean");
const {
    Quantity
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Range } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Ratio } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");

const {
    SubstanceSpecification_Relationship
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
SubstanceSpecification_Relationship.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    substanceReference: {
        type: Reference,
        default: void 0
    },
    substanceCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    relationship: {
        type: CodeableConcept,
        default: void 0
    },
    isDefining: boolean,
    amountQuantity: {
        type: Quantity,
        default: void 0
    },
    amountRange: {
        type: Range,
        default: void 0
    },
    amountRatio: {
        type: Ratio,
        default: void 0
    },
    amountString: string,
    amountRatioLowLimit: {
        type: Ratio,
        default: void 0
    },
    amountType: {
        type: CodeableConcept,
        default: void 0
    },
    source: {
        type: [Reference],
        default: void 0
    }
});
module.exports.SubstanceSpecification_Relationship =
    SubstanceSpecification_Relationship;
