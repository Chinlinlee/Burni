const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const uri = require('../FHIRDataTypesSchema/uri');
const dateTime = require('../FHIRDataTypesSchema/dateTime');
const integer = require('../FHIRDataTypesSchema/integer');
const {
    ValueSet_Parameter
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    ValueSet_Contains
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    ValueSet_Expansion
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ValueSet_Expansion.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    identifier: uri,
    timestamp: dateTime,
    total: integer,
    offset: integer,
    parameter: {
        type: [ValueSet_Parameter],
        default: void 0
    },
    contains: {
        type: [ValueSet_Contains],
        default: void 0
    },
    _identifier: {
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
    _timestamp: {
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
    _total: {
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
    _offset: {
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
module.exports.ValueSet_Expansion = ValueSet_Expansion;