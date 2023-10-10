const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Quantity
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    SubstanceSpecification_Property
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
SubstanceSpecification_Property.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    category: {
        type: CodeableConcept,
        default: void 0
    },
    code: {
        type: CodeableConcept,
        default: void 0
    },
    parameters: string,
    definingSubstanceReference: {
        type: Reference,
        default: void 0
    },
    definingSubstanceCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    amountQuantity: {
        type: Quantity,
        default: void 0
    },
    amountString: string
});
module.exports.SubstanceSpecification_Property =
    SubstanceSpecification_Property;
