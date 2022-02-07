const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const positiveInt = require('../FHIRDataTypesSchema/positiveInt');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const boolean = require('../FHIRDataTypesSchema/boolean');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    Claim_CareTeam
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Claim_CareTeam.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    sequence: positiveInt,
    provider: {
        type: Reference,
        required: true,
        default: void 0
    },
    responsible: boolean,
    role: {
        type: CodeableConcept,
        default: void 0
    },
    qualification: {
        type: CodeableConcept,
        default: void 0
    }
});
module.exports.Claim_CareTeam = Claim_CareTeam;