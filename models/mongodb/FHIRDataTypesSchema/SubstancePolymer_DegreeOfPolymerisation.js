const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    SubstanceAmount
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    SubstancePolymer_DegreeOfPolymerisation
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
SubstancePolymer_DegreeOfPolymerisation.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    degree: {
        type: CodeableConcept,
        default: void 0
    },
    amount: {
        type: SubstanceAmount,
        default: void 0
    }
});
module.exports.SubstancePolymer_DegreeOfPolymerisation = SubstancePolymer_DegreeOfPolymerisation;