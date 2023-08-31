const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    AdverseEvent_Causality
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    AdverseEvent_SuspectEntity
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
AdverseEvent_SuspectEntity.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    instance: {
        type: Reference,
        required: true,
        default: void 0
    },
    causality: {
        type: [AdverseEvent_Causality],
        default: void 0
    }
});
module.exports.AdverseEvent_SuspectEntity = AdverseEvent_SuspectEntity;
