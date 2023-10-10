const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const { Coding } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    AuditEvent_Source
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
AuditEvent_Source.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    site: string,
    observer: {
        type: Reference,
        required: true,
        default: void 0
    },
    type: {
        type: [Coding],
        default: void 0
    }
});
module.exports.AuditEvent_Source = AuditEvent_Source;
