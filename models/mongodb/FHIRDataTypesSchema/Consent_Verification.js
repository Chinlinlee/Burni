const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const boolean = require("../FHIRDataTypesSchema/boolean");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const dateTime = require("../FHIRDataTypesSchema/dateTime");

const {
    Consent_Verification
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Consent_Verification.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    verified: boolean,
    verifiedWith: {
        type: Reference,
        default: void 0
    },
    verificationDate: dateTime
});
module.exports.Consent_Verification = Consent_Verification;
