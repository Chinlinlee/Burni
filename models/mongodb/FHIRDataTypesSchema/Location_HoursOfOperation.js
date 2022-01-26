const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const code = require('../FHIRDataTypesSchema/code');
const boolean = require('../FHIRDataTypesSchema/boolean');
const time = require('../FHIRDataTypesSchema/time');

const {
    Location_HoursOfOperation
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Location_HoursOfOperation.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    daysOfWeek: {
        type: [code],
        default: void 0
    },
    allDay: boolean,
    openingTime: time,
    closingTime: time
});
module.exports.Location_HoursOfOperation = Location_HoursOfOperation;