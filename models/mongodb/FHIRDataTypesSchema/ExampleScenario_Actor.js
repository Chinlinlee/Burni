const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const markdown = require('../FHIRDataTypesSchema/markdown');

const {
    ExampleScenario_Actor
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ExampleScenario_Actor.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    actorId: string,
    type: {
        type: String,
        enum: ["person", "entity"],
        default: void 0
    },
    name: string,
    description: markdown
});
module.exports.ExampleScenario_Actor = ExampleScenario_Actor;