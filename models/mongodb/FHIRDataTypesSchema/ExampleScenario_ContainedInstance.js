const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');

const {
    ExampleScenario_ContainedInstance
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ExampleScenario_ContainedInstance.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    resourceId: string,
    versionId: string
});
module.exports.ExampleScenario_ContainedInstance = ExampleScenario_ContainedInstance;