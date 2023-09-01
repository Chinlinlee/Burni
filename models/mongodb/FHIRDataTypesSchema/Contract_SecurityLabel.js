const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const unsignedInt = require("../FHIRDataTypesSchema/unsignedInt");
const { Coding } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    Contract_SecurityLabel
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Contract_SecurityLabel.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    number: {
        type: [unsignedInt],
        default: void 0
    },
    classification: {
        type: Coding,
        required: true,
        default: void 0
    },
    category: {
        type: [Coding],
        default: void 0
    },
    control: {
        type: [Coding],
        default: void 0
    }
});
module.exports.Contract_SecurityLabel = Contract_SecurityLabel;
