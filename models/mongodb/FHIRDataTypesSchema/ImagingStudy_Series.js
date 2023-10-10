const mongoose = require("mongoose");
const {
    Extension
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const id = require("../FHIRDataTypesSchema/id");
const unsignedInt = require("../FHIRDataTypesSchema/unsignedInt");
const { Coding } = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const string = require("../FHIRDataTypesSchema/string");
const {
    Reference
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const dateTime = require("../FHIRDataTypesSchema/dateTime");
const {
    ImagingStudy_Performer
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
const {
    ImagingStudy_Instance
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");

const {
    ImagingStudy_Series
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ImagingStudy_Series.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    uid: id,
    number: unsignedInt,
    modality: {
        type: Coding,
        required: true,
        default: void 0
    },
    description: string,
    numberOfInstances: unsignedInt,
    endpoint: {
        type: [Reference],
        default: void 0
    },
    bodySite: {
        type: Coding,
        default: void 0
    },
    laterality: {
        type: Coding,
        default: void 0
    },
    specimen: {
        type: [Reference],
        default: void 0
    },
    started: dateTime,
    performer: {
        type: [ImagingStudy_Performer],
        default: void 0
    },
    instance: {
        type: [ImagingStudy_Instance],
        default: void 0
    }
});
module.exports.ImagingStudy_Series = ImagingStudy_Series;
