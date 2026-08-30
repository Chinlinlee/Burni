const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const dateTime = require('../FHIRDataTypesSchema/dateTime');
const {
    Period
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    BiologicallyDerivedProduct_Processing
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
BiologicallyDerivedProduct_Processing.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    description: string,
    procedure: {
        type: CodeableConcept,
        default: void 0
    },
    additive: {
        type: Reference,
        default: void 0
    },
    timeDateTime: dateTime,
    timePeriod: {
        type: Period,
        default: void 0
    },
    _description: {
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
    _timeDateTime: {
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
module.exports.BiologicallyDerivedProduct_Processing = BiologicallyDerivedProduct_Processing;