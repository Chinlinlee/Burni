const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const boolean = require('../FHIRDataTypesSchema/boolean');
const {
    Period
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CoverageEligibilityResponse_Item
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    CoverageEligibilityResponse_Insurance
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
CoverageEligibilityResponse_Insurance.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    coverage: {
        type: Reference,
        required: true,
        default: void 0
    },
    inforce: boolean,
    benefitPeriod: {
        type: Period,
        default: void 0
    },
    item: {
        type: [CoverageEligibilityResponse_Item],
        default: void 0
    }
});
module.exports.CoverageEligibilityResponse_Insurance = CoverageEligibilityResponse_Insurance;