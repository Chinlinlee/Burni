const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    CodeableConcept
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    MedicinalProductInteraction_Interactant
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MedicinalProductInteraction_Interactant.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    itemReference: {
        type: Reference,
        default: void 0
    },
    itemCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    }
});
module.exports.MedicinalProductInteraction_Interactant =
    MedicinalProductInteraction_Interactant;
