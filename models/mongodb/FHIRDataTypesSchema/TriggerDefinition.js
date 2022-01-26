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
    timingDate: string,
    timingDateTime: string,
    data: {
        type: [DataRequirement],
        default: void 0
    },
    condition: {
        type: Expression,
        default: void 0
    }
});
module.exports.TriggerDefinition = TriggerDefinition;