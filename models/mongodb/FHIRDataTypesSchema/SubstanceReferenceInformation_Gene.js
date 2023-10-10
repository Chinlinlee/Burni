const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    SubstanceReferenceInformation_Gene
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
SubstanceReferenceInformation_Gene.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    geneSequenceOrigin: {
        type: CodeableConcept,
        default: void 0
    },
    gene: {
        type: CodeableConcept,
        default: void 0
    },
    source: {
        type: [Reference],
        default: void 0
    }
});
module.exports.SubstanceReferenceInformation_Gene =
    SubstanceReferenceInformation_Gene;
