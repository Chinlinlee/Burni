const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Coding
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const base64Binary = require('../FHIRDataTypesSchema/base64Binary');
const {
    AuditEvent_Detail
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    AuditEvent_Entity
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
AuditEvent_Entity.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    what: {
        type: Reference,
        default: void 0
    },
    type: {
        type: Coding,
        default: void 0
    },
    role: {
        type: Coding,
        default: void 0
    },
    lifecycle: {
        type: Coding,
        default: void 0
    },
    securityLabel: {
        type: [Coding],
        default: void 0
    },
    name: string,
    description: string,
    query: base64Binary,
    detail: {
        type: [AuditEvent_Detail],
        default: void 0
    }
});
module.exports.AuditEvent_Entity = AuditEvent_Entity;