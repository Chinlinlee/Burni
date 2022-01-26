const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const uri = require('../FHIRDataTypesSchema/uri');
const dateTime = require('../FHIRDataTypesSchema/dateTime');

const {
    Immunization_Education
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Immunization_Education.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    documentType: string,
    reference: uri,
    publicationDate: dateTime,
    presentationDate: dateTime
});
module.exports.Immunization_Education = Immunization_Education;