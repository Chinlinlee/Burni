const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const {
    Timing
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const date = require('../FHIRDataTypesSchema/date');
const dateTime = require('../FHIRDataTypesSchema/dateTime');
const {
    DataRequirement
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Expression
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    TriggerDefinition
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
TriggerDefinition.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    type: {
        type: String,
        enum: ["named-event", "periodic", "data-changed", "data-added", "data-modified", "data-removed", "data-accessed", "data-access-ended"],
        default: void 0
    },
    name: string,
    timingTiming: {
        type: Timing,
        default: void 0
    },
    timingReference: {
        type: Reference,
        default: void 0
    },
    timingDate: date,
    timingDateTime: dateTime,
    data: {
        type: [DataRequirement],
        default: void 0
    },
    condition: {
        type: Expression,
        default: void 0
    },
    _type: {
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
    _timingDate: {
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
    _timingDateTime: {
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
module.exports.TriggerDefinition = TriggerDefinition;