const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const {
    Period
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Duration
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Quantity
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    Specimen_Collection
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Specimen_Collection.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    collector: {
        type: Reference,
        default: void 0
    },
    collectedDateTime: string,
    collectedPeriod: {
        type: Period,
        default: void 0
    },
    duration: {
        type: Duration,
        default: void 0
    },
    quantity: {
        type: Quantity,
        default: void 0
    },
    method: {
        type: CodeableConcept,
        default: void 0
    },
    bodySite: {
        type: CodeableConcept,
        default: void 0
    },
    fastingStatusCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    fastingStatusDuration: {
        type: Duration,
        default: void 0
    }
});
module.exports.Specimen_Collection = Specimen_Collection;