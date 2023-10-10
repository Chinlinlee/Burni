const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const {
    SubstanceAmount
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    SubstancePolymer_DegreeOfPolymerisation
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    SubstancePolymer_StructuralRepresentation
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    SubstancePolymer_RepeatUnit
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
SubstancePolymer_RepeatUnit.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    orientationOfPolymerisation: {
        type: CodeableConcept,
        default: void 0
    },
    repeatUnit: string,
    amount: {
        type: SubstanceAmount,
        default: void 0
    },
    degreeOfPolymerisation: {
        type: [SubstancePolymer_DegreeOfPolymerisation],
        default: void 0
    },
    structuralRepresentation: {
        type: [SubstancePolymer_StructuralRepresentation],
        default: void 0
    }
});
module.exports.SubstancePolymer_RepeatUnit = SubstancePolymer_RepeatUnit;
