const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const uri = require("../FHIRDataTypesSchema/uri");

const {
    Consent_Policy
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Consent_Policy.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    authority: uri,
    uri: uri
});
module.exports.Consent_Policy = Consent_Policy;
