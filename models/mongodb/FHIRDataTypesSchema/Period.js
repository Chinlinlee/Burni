const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const dateTime = require('../FHIRDataTypesSchema/dateTime');

const {
    Period
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Period.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    start: dateTime,
    end: dateTime
});
module.exports.Period = Period;