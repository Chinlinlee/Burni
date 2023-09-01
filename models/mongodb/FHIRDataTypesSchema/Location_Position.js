const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const decimal = require("../FHIRDataTypesSchema/decimal");

const {
    Location_Position
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Location_Position.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    longitude: decimal,
    latitude: decimal,
    altitude: decimal
});
module.exports.Location_Position = Location_Position;
