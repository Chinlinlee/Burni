const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const markdown = require('../FHIRDataTypesSchema/markdown');
const {
    ExampleScenario_Step
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    ExampleScenario_Process
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ExampleScenario_Process.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    title: string,
    description: markdown,
    preConditions: markdown,
    postConditions: markdown,
    step: {
        type: [ExampleScenario_Step],
        default: void 0
    }
});
module.exports.ExampleScenario_Process = ExampleScenario_Process;