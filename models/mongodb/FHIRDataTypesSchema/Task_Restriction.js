const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const positiveInt = require("../FHIRDataTypesSchema/positiveInt");
const { Period } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    Task_Restriction
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Task_Restriction.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    repetitions: positiveInt,
    period: {
        type: Period,
        default: void 0
    },
    recipient: {
        type: [Reference],
        default: void 0
    }
});
module.exports.Task_Restriction = Task_Restriction;
