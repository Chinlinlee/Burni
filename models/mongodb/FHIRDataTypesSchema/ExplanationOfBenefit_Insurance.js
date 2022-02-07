const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const boolean = require('../FHIRDataTypesSchema/boolean');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');

const {
    ExplanationOfBenefit_Insurance
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ExplanationOfBenefit_Insurance.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    focal: boolean,
    coverage: {
        type: Reference,
        required: true,
        default: void 0
    },
    preAuthRef: {
        type: [string],
        default: void 0
    }
});
module.exports.ExplanationOfBenefit_Insurance = ExplanationOfBenefit_Insurance;