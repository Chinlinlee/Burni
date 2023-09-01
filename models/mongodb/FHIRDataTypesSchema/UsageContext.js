const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Coding } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Quantity
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Range } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    UsageContext
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
UsageContext.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    code: {
        type: Coding,
        required: true,
        default: void 0
    },
    valueCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    valueQuantity: {
        type: Quantity,
        default: void 0
    },
    valueRange: {
        type: Range,
        default: void 0
    },
    valueReference: {
        type: Reference,
        default: void 0
    }
});
module.exports.UsageContext = UsageContext;
