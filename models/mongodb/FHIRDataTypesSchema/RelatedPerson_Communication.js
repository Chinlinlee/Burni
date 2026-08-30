const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const boolean = require('../FHIRDataTypesSchema/boolean');

const {
    RelatedPerson_Communication
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
RelatedPerson_Communication.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    language: {
        type: CodeableConcept,
        required: true,
        default: void 0
    },
    preferred: boolean,
    _preferred: {
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
module.exports.RelatedPerson_Communication = RelatedPerson_Communication;