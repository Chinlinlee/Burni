const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const code = require("../FHIRDataTypesSchema/code");
const boolean = require("../FHIRDataTypesSchema/boolean");
const time = require("../FHIRDataTypesSchema/time");

const {
    PractitionerRole_AvailableTime
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
PractitionerRole_AvailableTime.add({
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
    availableStartTime: time,
    availableEndTime: time
});
module.exports.PractitionerRole_AvailableTime = PractitionerRole_AvailableTime;
