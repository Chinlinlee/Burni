const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const {
    CodeableConcept
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const decimal = require('../FHIRDataTypesSchema/decimal');
const integer = require('../FHIRDataTypesSchema/integer');
const {
    RiskEvidenceSynthesis_PrecisionEstimate
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    RiskEvidenceSynthesis_RiskEstimate
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
RiskEvidenceSynthesis_RiskEstimate.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    description: string,
    type: {
        type: CodeableConcept,
        default: void 0
    },
    value: decimal,
    unitOfMeasure: {
        type: CodeableConcept,
        default: void 0
    },
    denominatorCount: integer,
    numeratorCount: integer,
    precisionEstimate: {
        type: [RiskEvidenceSynthesis_PrecisionEstimate],
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
    _value: {
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
    _denominatorCount: {
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
    _numeratorCount: {
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
module.exports.RiskEvidenceSynthesis_RiskEstimate = RiskEvidenceSynthesis_RiskEstimate;