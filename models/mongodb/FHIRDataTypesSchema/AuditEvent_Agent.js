const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const boolean = require("../FHIRDataTypesSchema/boolean");
const uri = require("../FHIRDataTypesSchema/uri");
const { Coding } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    AuditEvent_Network
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    AuditEvent_Agent
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
AuditEvent_Agent.add({
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
    role: {
        type: [CodeableConcept],
        default: void 0
    },
    who: {
        type: Reference,
        default: void 0
    },
    altId: string,
    name: string,
    requestor: boolean,
    location: {
        type: Reference,
        default: void 0
    },
    policy: {
        type: [uri],
        default: void 0
    },
    media: {
        type: Coding,
        default: void 0
    },
    network: {
        type: AuditEvent_Network,
        default: void 0
    },
    purposeOfUse: {
        type: [CodeableConcept],
        default: void 0
    }
});
module.exports.AuditEvent_Agent = AuditEvent_Agent;
