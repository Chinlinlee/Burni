const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const integer = require('../FHIRDataTypesSchema/integer');
const string = require('../FHIRDataTypesSchema/string');
const {
    Attachment
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    SubstanceNucleicAcid_Linkage
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    SubstanceNucleicAcid_Sugar
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    SubstanceNucleicAcid_Subunit
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
SubstanceNucleicAcid_Subunit.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    subunit: integer,
    sequence: string,
    length: integer,
    sequenceAttachment: {
        type: Attachment,
        default: void 0
    },
    fivePrime: {
        type: CodeableConcept,
        default: void 0
    },
    threePrime: {
        type: CodeableConcept,
        default: void 0
    },
    linkage: {
        type: [SubstanceNucleicAcid_Linkage],
        default: void 0
    },
    sugar: {
        type: [SubstanceNucleicAcid_Sugar],
        default: void 0
    }
});
module.exports.SubstanceNucleicAcid_Subunit = SubstanceNucleicAcid_Subunit;