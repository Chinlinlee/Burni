const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const decimal = require("../FHIRDataTypesSchema/decimal");
const integer = require("../FHIRDataTypesSchema/integer");

const {
    ObservationDefinition_QuantitativeDetails
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ObservationDefinition_QuantitativeDetails.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    customaryUnit: {
        type: CodeableConcept,
        default: void 0
    },
    unit: {
        type: CodeableConcept,
        default: void 0
    },
    conversionFactor: decimal,
    decimalPrecision: integer
});
module.exports.ObservationDefinition_QuantitativeDetails =
    ObservationDefinition_QuantitativeDetails;
