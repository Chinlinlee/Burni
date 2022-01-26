const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const positiveInt = require('../FHIRDataTypesSchema/positiveInt');
const {
    Period
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    ContactPoint
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ContactPoint.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    system: {
        type: String,
        enum: ["phone", "fax", "email", "pager", "url", "sms", "other"],
        default: void 0
    },
    value: string,
    use: {
        type: String,
        enum: ["home", "work", "temp", "old", "mobile"],
        default: void 0
    },
    rank: positiveInt,
    period: {
        type: Period,
        default: void 0
    }
});
module.exports.ContactPoint = ContactPoint;