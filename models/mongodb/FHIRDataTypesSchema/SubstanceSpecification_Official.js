const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const dateTime = require('../FHIRDataTypesSchema/dateTime');

const {
    SubstanceSpecification_Official
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
SubstanceSpecification_Official.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    authority: {
        type: CodeableConcept,
        default: void 0
    },
    status: {
        type: CodeableConcept,
        default: void 0
    },
    date: dateTime
});
module.exports.SubstanceSpecification_Official = SubstanceSpecification_Official;