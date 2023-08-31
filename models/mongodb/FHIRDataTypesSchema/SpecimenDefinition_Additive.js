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
    SpecimenDefinition_Additive
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
SpecimenDefinition_Additive.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    additiveCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    additiveReference: {
        type: Reference,
        default: void 0
    }
});
module.exports.SpecimenDefinition_Additive = SpecimenDefinition_Additive;
