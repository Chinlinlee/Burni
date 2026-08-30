const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const date = require('../FHIRDataTypesSchema/date');
const time = require('../FHIRDataTypesSchema/time');
const string = require('../FHIRDataTypesSchema/string');
const {
    Coding
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    Reference
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const boolean = require('../FHIRDataTypesSchema/boolean');

const {
    Questionnaire_AnswerOption
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Questionnaire_AnswerOption.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    valueInteger: {
        type: Number,
        default: void 0
    },
    valueDate: date,
    valueTime: time,
    valueString: string,
    valueCoding: {
        type: Coding,
        default: void 0
    },
    valueReference: {
        type: Reference,
        default: void 0
    },
    initialSelected: boolean,
    _valueInteger: {
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
    _valueDate: {
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
    _valueTime: {
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
    _valueString: {
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
    _initialSelected: {
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
module.exports.Questionnaire_AnswerOption = Questionnaire_AnswerOption;