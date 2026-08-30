const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');

const {
    ClinicalImpression_Finding
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ClinicalImpression_Finding.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    itemCodeableConcept: {
        type: CodeableConcept,
        default: void 0
    },
    itemReference: {
        type: Reference,
        default: void 0
    },
    basis: string,
    _basis: {
        type: new mongoose.Schema({
            extension: {
                type: [Extension],
                default: void 0
            }
        }, {
            _id: false,
            id: false,
            toObject: {
                getters: true
            }
        }),
        default: void 0
    }
});
module.exports.ClinicalImpression_Finding = ClinicalImpression_Finding;