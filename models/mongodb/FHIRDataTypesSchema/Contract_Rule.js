const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Attachment
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    Contract_Rule
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Contract_Rule.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    contentAttachment: {
        type: Attachment,
        default: void 0
    },
    contentReference: {
        type: Reference,
        default: void 0
    }
});
module.exports.Contract_Rule = Contract_Rule;
