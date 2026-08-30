const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const code = require('../FHIRDataTypesSchema/code');
const markdown = require('../FHIRDataTypesSchema/markdown');
const {
    ExampleScenario_Version
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    ExampleScenario_ContainedInstance
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

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
    },
    _resourceId: {
        type: new mongoose.Schema({
            extension: {
                type: [Extension],
                default: void 0
            }
        }, {
            _id: false,
            id: false,
            toObject: {
                getters: true
            }
        }),
        default: void 0
    },
    _resourceType: {
        type: new mongoose.Schema({
            extension: {
                type: [Extension],
                default: void 0
            }
        }, {
            _id: false,
            id: false,
            toObject: {
                getters: true
            }
        }),
        default: void 0
    },
    _name: {
        type: new mongoose.Schema({
            extension: {
                type: [Extension],
                default: void 0
            }
        }, {
            _id: false,
            id: false,
            toObject: {
                getters: true
            }
        }),
        default: void 0
    },
    _description: {
        type: new mongoose.Schema({
            extension: {
                type: [Extension],
                default: void 0
            }
        }, {
            _id: false,
            id: false,
            toObject: {
                getters: true
            }
        }),
        default: void 0
    }
});
module.exports.ExampleScenario_Instance = ExampleScenario_Instance;