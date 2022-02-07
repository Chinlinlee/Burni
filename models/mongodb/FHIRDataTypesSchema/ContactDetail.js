const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const {
    ContactPoint
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    ContactDetail
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ContactDetail.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    name: string,
    telecom: {
        type: [ContactPoint],
        default: void 0
    }
});
module.exports.ContactDetail = ContactDetail;