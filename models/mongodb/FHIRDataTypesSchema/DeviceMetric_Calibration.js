const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const instant = require("../FHIRDataTypesSchema/instant");

const {
    DeviceMetric_Calibration
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
DeviceMetric_Calibration.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    type: {
        type: String,
        enum: ["unspecified", "offset", "gain", "two-point"],
        default: void 0
    },
    state: {
        type: String,
        enum: [
            "not-calibrated",
            "calibration-required",
            "calibrated",
            "unspecified"
        ],
        default: void 0
    },
    time: instant
});
module.exports.DeviceMetric_Calibration = DeviceMetric_Calibration;
