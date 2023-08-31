const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const positiveInt = require("../FHIRDataTypesSchema/positiveInt");
const boolean = require("../FHIRDataTypesSchema/boolean");
const {
    Identifier
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");

const {
    Claim_Insurance
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Claim_Insurance.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    sequence: positiveInt,
    focal: boolean,
    identifier: {
        type: Identifier,
        default: void 0
    },
    coverage: {
        type: Reference,
        required: true,
        default: void 0
    },
    businessArrangement: string,
    preAuthRef: {
        type: [string],
        default: void 0
    },
    claimResponse: {
        type: Reference,
        default: void 0
    }
});
module.exports.Claim_Insurance = Claim_Insurance;
