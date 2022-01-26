const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');

const {
    OperationDefinition_ReferencedFrom
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
OperationDefinition_ReferencedFrom.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    source: string,
    sourceId: string
});
module.exports.OperationDefinition_ReferencedFrom = OperationDefinition_ReferencedFrom;