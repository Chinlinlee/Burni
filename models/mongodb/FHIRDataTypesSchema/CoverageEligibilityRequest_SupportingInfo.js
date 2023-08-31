const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const positiveInt = require("../FHIRDataTypesSchema/positiveInt");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const boolean = require("../FHIRDataTypesSchema/boolean");

const {
    CoverageEligibilityRequest_SupportingInfo
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
CoverageEligibilityRequest_SupportingInfo.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    sequence: positiveInt,
    information: {
        type: Reference,
        required: true,
        default: void 0
    },
    appliesToAll: boolean
});
module.exports.CoverageEligibilityRequest_SupportingInfo =
    CoverageEligibilityRequest_SupportingInfo;
