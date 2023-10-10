const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    ExampleScenario_Process
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const boolean = require("../FHIRDataTypesSchema/boolean");
const {
    ExampleScenario_Operation
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    ExampleScenario_Alternative
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    ExampleScenario_Step
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ExampleScenario_Step.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    process: {
        type: [ExampleScenario_Process],
        default: void 0
    },
    pause: boolean,
    operation: {
        type: ExampleScenario_Operation,
        default: void 0
    },
    alternative: {
        type: [ExampleScenario_Alternative],
        default: void 0
    }
});
module.exports.ExampleScenario_Step = ExampleScenario_Step;
