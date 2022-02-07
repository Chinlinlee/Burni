const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const dateTime = require('../FHIRDataTypesSchema/dateTime');

const {
    Medication_Batch
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Medication_Batch.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    lotNumber: string,
    expirationDate: dateTime
});
module.exports.Medication_Batch = Medication_Batch;