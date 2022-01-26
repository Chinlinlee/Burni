const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const positiveInt = require('../FHIRDataTypesSchema/positiveInt');
const {
    Money
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');

const {
    InsurancePlan_GeneralCost
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
InsurancePlan_GeneralCost.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    type: {
        type: CodeableConcept,
        default: void 0
    },
    groupSize: positiveInt,
    cost: {
        type: Money,
        default: void 0
    },
    comment: string
});
module.exports.InsurancePlan_GeneralCost = InsurancePlan_GeneralCost;