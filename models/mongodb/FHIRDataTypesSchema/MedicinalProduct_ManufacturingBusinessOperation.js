const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Identifier
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const dateTime = require("../FHIRDataTypesSchema/dateTime");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    MedicinalProduct_ManufacturingBusinessOperation
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MedicinalProduct_ManufacturingBusinessOperation.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    operationType: {
        type: CodeableConcept,
        default: void 0
    },
    authorisationReferenceNumber: {
        type: Identifier,
        default: void 0
    },
    effectiveDate: dateTime,
    confidentialityIndicator: {
        type: CodeableConcept,
        default: void 0
    },
    manufacturer: {
        type: [Reference],
        default: void 0
    },
    regulator: {
        type: Reference,
        default: void 0
    }
});
module.exports.MedicinalProduct_ManufacturingBusinessOperation =
    MedicinalProduct_ManufacturingBusinessOperation;
