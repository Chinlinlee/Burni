const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const {
    TestReport_Action1
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    TestReport_Test
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
TestReport_Test.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    name: string,
    description: string,
    action: {
        type: [TestReport_Action1],
        required: true,
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
module.exports.TestReport_Test = TestReport_Test;