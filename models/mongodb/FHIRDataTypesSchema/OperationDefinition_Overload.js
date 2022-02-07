const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');

const {
    OperationDefinition_Overload
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
OperationDefinition_Overload.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    parameterName: {
        type: [string],
        default: void 0
    },
    comment: string
});
module.exports.OperationDefinition_Overload = OperationDefinition_Overload;