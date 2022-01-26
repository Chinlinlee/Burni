const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const code = require('../FHIRDataTypesSchema/code');
const {
    Expression
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    RequestGroup_Condition
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
RequestGroup_Condition.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    kind: code,
    expression: {
        type: Expression,
        default: void 0
    }
});
module.exports.RequestGroup_Condition = RequestGroup_Condition;