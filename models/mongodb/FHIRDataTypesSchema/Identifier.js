const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const uri = require("../FHIRDataTypesSchema/uri");
const string = require("../FHIRDataTypesSchema/string");
const { Period } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    Identifier
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Identifier.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    use: {
        type: String,
        enum: ["usual", "official", "temp", "secondary", "old"],
        default: void 0
    },
    type: {
        type: CodeableConcept,
        default: void 0
    },
    system: uri,
    value: string,
    period: {
        type: Period,
        default: void 0
    },
    assigner: {
        type: Reference,
        default: void 0
    }
});
module.exports.Identifier = Identifier;
