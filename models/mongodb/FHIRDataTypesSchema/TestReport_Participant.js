const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const uri = require('../FHIRDataTypesSchema/uri');
const string = require('../FHIRDataTypesSchema/string');

const {
    TestReport_Participant
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
TestReport_Participant.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    type: {
        type: String,
        enum: ["test-engine", "client", "server"],
        default: void 0
    },
    uri: uri,
    display: string
});
module.exports.TestReport_Participant = TestReport_Participant;