const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const { Period } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const { Address } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Address.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    use: {
        type: String,
        enum: ["home", "work", "temp", "old", "billing"],
        default: void 0
    },
    type: {
        type: String,
        enum: ["postal", "physical", "both"],
        default: void 0
    },
    text: string,
    line: {
        type: [string],
        default: void 0
    },
    city: string,
    district: string,
    state: string,
    postalCode: string,
    country: string,
    period: {
        type: Period,
        default: void 0
    }
});
module.exports.Address = Address;
