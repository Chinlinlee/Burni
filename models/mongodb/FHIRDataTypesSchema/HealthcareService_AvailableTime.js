const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const boolean = require('../FHIRDataTypesSchema/boolean');
const time = require('../FHIRDataTypesSchema/time');

const {
    HealthcareService_AvailableTime
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
HealthcareService_AvailableTime.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    daysOfWeek: {
        type: [String],
        default: void 0
    },
    allDay: boolean,
    availableStartTime: time,
    availableEndTime: time
});
module.exports.HealthcareService_AvailableTime = HealthcareService_AvailableTime;