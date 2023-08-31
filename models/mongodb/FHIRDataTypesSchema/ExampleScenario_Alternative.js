const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const markdown = require("../FHIRDataTypesSchema/markdown");
const {
    ExampleScenario_Step
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    ExampleScenario_Alternative
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ExampleScenario_Alternative.add({
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
    step: {
        type: [ExampleScenario_Step],
        default: void 0
    }
});
module.exports.ExampleScenario_Alternative = ExampleScenario_Alternative;
