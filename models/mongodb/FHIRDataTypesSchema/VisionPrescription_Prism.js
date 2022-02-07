const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const decimal = require('../FHIRDataTypesSchema/decimal');

const {
    VisionPrescription_Prism
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
VisionPrescription_Prism.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    amount: decimal,
    base: {
        type: String,
        enum: ["up", "down", "in", "out"],
        default: void 0
    }
});
module.exports.VisionPrescription_Prism = VisionPrescription_Prism;