const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const url = require("../FHIRDataTypesSchema/url");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    CapabilityStatement_Implementation
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
CapabilityStatement_Implementation.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    description: string,
    url: url,
    custodian: {
        type: Reference,
        default: void 0
    }
});
module.exports.CapabilityStatement_Implementation =
    CapabilityStatement_Implementation;
