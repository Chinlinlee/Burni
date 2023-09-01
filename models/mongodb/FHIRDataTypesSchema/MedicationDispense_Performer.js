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
    MedicationDispense_Performer
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MedicationDispense_Performer.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    function: {
        type: CodeableConcept,
        default: void 0
    },
    actor: {
        type: Reference,
        required: true,
        default: void 0
    }
});
module.exports.MedicationDispense_Performer = MedicationDispense_Performer;
