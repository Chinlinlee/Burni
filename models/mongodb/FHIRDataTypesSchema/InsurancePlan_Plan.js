const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Identifier
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    InsurancePlan_GeneralCost
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    InsurancePlan_SpecificCost
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    InsurancePlan_Plan
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
InsurancePlan_Plan.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    identifier: {
        type: [Identifier],
        default: void 0
    },
    type: {
        type: CodeableConcept,
        default: void 0
    },
    coverageArea: {
        type: [Reference],
        default: void 0
    },
    network: {
        type: [Reference],
        default: void 0
    },
    generalCost: {
        type: [InsurancePlan_GeneralCost],
        default: void 0
    },
    specificCost: {
        type: [InsurancePlan_SpecificCost],
        default: void 0
    }
});
module.exports.InsurancePlan_Plan = InsurancePlan_Plan;