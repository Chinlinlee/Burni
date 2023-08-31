const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const boolean = require("../FHIRDataTypesSchema/boolean");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const markdown = require("../FHIRDataTypesSchema/markdown");

const {
    CapabilityStatement_Security
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
CapabilityStatement_Security.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    cors: boolean,
    service: {
        type: [CodeableConcept],
        default: void 0
    },
    description: markdown
});
module.exports.CapabilityStatement_Security = CapabilityStatement_Security;
