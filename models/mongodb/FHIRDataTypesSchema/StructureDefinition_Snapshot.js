const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    ElementDefinition
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    StructureDefinition_Snapshot
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
StructureDefinition_Snapshot.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    element: {
        type: [ElementDefinition],
        required: true,
        default: void 0
    }
});
module.exports.StructureDefinition_Snapshot = StructureDefinition_Snapshot;
