const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Range } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Quantity
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Ratio } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    Dosage_DoseAndRate
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Dosage_DoseAndRate.add({
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
    doseRange: {
        type: Range,
        default: void 0
    },
    doseQuantity: {
        type: Quantity,
        default: void 0
    },
    rateRatio: {
        type: Ratio,
        default: void 0
    },
    rateRange: {
        type: Range,
        default: void 0
    },
    rateQuantity: {
        type: Quantity,
        default: void 0
    }
});
module.exports.Dosage_DoseAndRate = Dosage_DoseAndRate;
