const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Range
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');

const {
    ObservationDefinition_QualifiedInterval
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ObservationDefinition_QualifiedInterval.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    category: {
        type: String,
        enum: ["reference", "critical", "absolute"],
        default: void 0
    },
    range: {
        type: Range,
        default: void 0
    },
    context: {
        type: CodeableConcept,
        default: void 0
    },
    appliesTo: {
        type: [CodeableConcept],
        default: void 0
    },
    gender: {
        type: String,
        enum: ["male", "female", "other", "unknown"],
        default: void 0
    },
    age: {
        type: Range,
        default: void 0
    },
    gestationalAge: {
        type: Range,
        default: void 0
    },
    condition: string,
    _category: {
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
    },
    _gender: {
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
    },
    _condition: {
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
module.exports.ObservationDefinition_QualifiedInterval = ObservationDefinition_QualifiedInterval;