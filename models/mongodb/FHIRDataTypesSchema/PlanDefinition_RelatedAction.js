const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const id = require('../FHIRDataTypesSchema/id');
const {
    Duration
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Range
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    PlanDefinition_RelatedAction
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
PlanDefinition_RelatedAction.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    actionId: id,
    relationship: {
        type: String,
        enum: ["before-start", "before", "before-end", "concurrent-with-start", "concurrent", "concurrent-with-end", "after-start", "after", "after-end"],
        default: void 0
    },
    offsetDuration: {
        type: Duration,
        default: void 0
    },
    offsetRange: {
        type: Range,
        default: void 0
    }
});
module.exports.PlanDefinition_RelatedAction = PlanDefinition_RelatedAction;