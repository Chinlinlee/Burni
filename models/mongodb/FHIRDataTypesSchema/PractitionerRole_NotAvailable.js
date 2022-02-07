const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const {
    Period
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    PractitionerRole_NotAvailable
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
PractitionerRole_NotAvailable.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    description: string,
    during: {
        type: Period,
        default: void 0
    }
});
module.exports.PractitionerRole_NotAvailable = PractitionerRole_NotAvailable;