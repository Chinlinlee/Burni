const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');

const {
    SubstanceSourceMaterial_Author
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
SubstanceSourceMaterial_Author.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    authorType: {
        type: CodeableConcept,
        default: void 0
    },
    authorDescription: string
});
module.exports.SubstanceSourceMaterial_Author = SubstanceSourceMaterial_Author;