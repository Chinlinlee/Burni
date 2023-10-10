const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const {
    SubstanceSpecification_Isotope
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    SubstanceSpecification_MolecularWeight
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    SubstanceSpecification_Representation
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    SubstanceSpecification_Structure
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
SubstanceSpecification_Structure.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    stereochemistry: {
        type: CodeableConcept,
        default: void 0
    },
    opticalActivity: {
        type: CodeableConcept,
        default: void 0
    },
    molecularFormula: string,
    molecularFormulaByMoiety: string,
    isotope: {
        type: [SubstanceSpecification_Isotope],
        default: void 0
    },
    molecularWeight: {
        type: SubstanceSpecification_MolecularWeight,
        default: void 0
    },
    source: {
        type: [Reference],
        default: void 0
    },
    representation: {
        type: [SubstanceSpecification_Representation],
        default: void 0
    }
});
module.exports.SubstanceSpecification_Structure =
    SubstanceSpecification_Structure;
