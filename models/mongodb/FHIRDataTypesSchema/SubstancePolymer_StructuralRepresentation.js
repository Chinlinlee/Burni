const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const {
    Attachment
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    SubstancePolymer_StructuralRepresentation
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
SubstancePolymer_StructuralRepresentation.add({
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
    representation: string,
    attachment: {
        type: Attachment,
        default: void 0
    }
});
module.exports.SubstancePolymer_StructuralRepresentation =
    SubstancePolymer_StructuralRepresentation;
