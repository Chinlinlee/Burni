const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const markdown = require("../FHIRDataTypesSchema/markdown");
const boolean = require("../FHIRDataTypesSchema/boolean");
const {
    ExampleScenario_ContainedInstance
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    ExampleScenario_Operation
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ExampleScenario_Operation.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    number: string,
    type: string,
    name: string,
    initiator: string,
    receiver: string,
    description: markdown,
    initiatorActive: boolean,
    receiverActive: boolean,
    request: {
        type: ExampleScenario_ContainedInstance,
        default: void 0
    },
    response: {
        type: ExampleScenario_ContainedInstance,
        default: void 0
    }
});
module.exports.ExampleScenario_Operation = ExampleScenario_Operation;
