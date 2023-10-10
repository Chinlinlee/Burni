const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const code = require("../FHIRDataTypesSchema/code");
const {
    Identifier
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    Composition_RelatesTo
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Composition_RelatesTo.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    code: code,
    targetIdentifier: {
        type: Identifier,
        default: void 0
    },
    targetReference: {
        type: Reference,
        default: void 0
    }
});
module.exports.Composition_RelatesTo = Composition_RelatesTo;
