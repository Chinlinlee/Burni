const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Provenance_Agent
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    Provenance_Entity
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Provenance_Entity.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    role: {
        type: String,
        enum: ["derivation", "revision", "quotation", "source", "removal"],
        default: void 0
    },
    what: {
        type: Reference,
        required: true,
        default: void 0
    },
    agent: {
        type: [Provenance_Agent],
        default: void 0
    }
});
module.exports.Provenance_Entity = Provenance_Entity;
