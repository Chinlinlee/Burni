const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const uri = require('../FHIRDataTypesSchema/uri');
const string = require('../FHIRDataTypesSchema/string');

const {
    MolecularSequence_Repository
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
MolecularSequence_Repository.add({
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
        enum: ["directlink", "openapi", "login", "oauth", "other"],
        default: void 0
    },
    url: uri,
    name: string,
    datasetId: string,
    variantsetId: string,
    readsetId: string
});
module.exports.MolecularSequence_Repository = MolecularSequence_Repository;