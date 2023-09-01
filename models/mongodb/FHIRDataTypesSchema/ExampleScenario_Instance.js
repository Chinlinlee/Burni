const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const code = require("../FHIRDataTypesSchema/code");
const markdown = require("../FHIRDataTypesSchema/markdown");
const {
    ExampleScenario_Version
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    ExampleScenario_ContainedInstance
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    ExampleScenario_Instance
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ExampleScenario_Instance.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    resourceId: string,
    resourceType: code,
    name: string,
    description: markdown,
    version: {
        type: [ExampleScenario_Version],
        default: void 0
    },
    containedInstance: {
        type: [ExampleScenario_ContainedInstance],
        default: void 0
    }
});
module.exports.ExampleScenario_Instance = ExampleScenario_Instance;
