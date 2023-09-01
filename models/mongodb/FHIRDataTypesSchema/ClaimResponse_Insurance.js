const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const positiveInt = require("../FHIRDataTypesSchema/positiveInt");
const boolean = require("../FHIRDataTypesSchema/boolean");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");

const {
    ClaimResponse_Insurance
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ClaimResponse_Insurance.add({
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
    coverage: {
        type: Reference,
        required: true,
        default: void 0
    },
    businessArrangement: string,
    claimResponse: {
        type: Reference,
        default: void 0
    }
});
module.exports.ClaimResponse_Insurance = ClaimResponse_Insurance;
