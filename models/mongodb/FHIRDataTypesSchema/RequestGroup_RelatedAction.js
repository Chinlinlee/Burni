const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const id = require('../FHIRDataTypesSchema/id');
const code = require('../FHIRDataTypesSchema/code');
const {
    Duration
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Range
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    RequestGroup_RelatedAction
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
RequestGroup_RelatedAction.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    actionId: id,
    relationship: code,
    offsetDuration: {
        type: Duration,
        default: void 0
    },
    offsetRange: {
        type: Range,
        default: void 0
    }
});
module.exports.RequestGroup_RelatedAction = RequestGroup_RelatedAction;