const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Period
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    Composition_Event
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Composition_Event.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    code: {
        type: [CodeableConcept],
        default: void 0
    },
    period: {
        type: Period,
        default: void 0
    },
    detail: {
        type: [Reference],
        default: void 0
    }
});
module.exports.Composition_Event = Composition_Event;