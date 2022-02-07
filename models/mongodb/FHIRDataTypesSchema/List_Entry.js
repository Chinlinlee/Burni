const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const boolean = require('../FHIRDataTypesSchema/boolean');
const dateTime = require('../FHIRDataTypesSchema/dateTime');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    List_Entry
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
List_Entry.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    flag: {
        type: CodeableConcept,
        default: void 0
    },
    deleted: boolean,
    date: dateTime,
    item: {
        type: Reference,
        required: true,
        default: void 0
    }
});
module.exports.List_Entry = List_Entry;