const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const boolean = require('../FHIRDataTypesSchema/boolean');
const string = require('../FHIRDataTypesSchema/string');
const {
    CoverageEligibilityResponse_Benefit
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const uri = require('../FHIRDataTypesSchema/uri');

const {
    CoverageEligibilityResponse_Item
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
CoverageEligibilityResponse_Item.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    category: {
        type: CodeableConcept,
        default: void 0
    },
    productOrService: {
        type: CodeableConcept,
        default: void 0
    },
    modifier: {
        type: [CodeableConcept],
        default: void 0
    },
    provider: {
        type: Reference,
        default: void 0
    },
    excluded: boolean,
    name: string,
    description: string,
    network: {
        type: CodeableConcept,
        default: void 0
    },
    unit: {
        type: CodeableConcept,
        default: void 0
    },
    term: {
        type: CodeableConcept,
        default: void 0
    },
    benefit: {
        type: [CoverageEligibilityResponse_Benefit],
        default: void 0
    },
    authorizationRequired: boolean,
    authorizationSupporting: {
        type: [CodeableConcept],
        default: void 0
    },
    authorizationUrl: uri
});
module.exports.CoverageEligibilityResponse_Item = CoverageEligibilityResponse_Item;