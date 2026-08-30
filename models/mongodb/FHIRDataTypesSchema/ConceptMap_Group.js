const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const uri = require('../FHIRDataTypesSchema/uri');
const string = require('../FHIRDataTypesSchema/string');
const {
    ConceptMap_Element
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    ConceptMap_Unmapped
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    ConceptMap_Group
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
ConceptMap_Group.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    source: uri,
    sourceVersion: string,
    target: uri,
    targetVersion: string,
    element: {
        type: [ConceptMap_Element],
        required: true,
        default: void 0
    },
    unmapped: {
        type: ConceptMap_Unmapped,
        default: void 0
    },
    _source: {
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
    _sourceVersion: {
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
    _target: {
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
    _targetVersion: {
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
module.exports.ConceptMap_Group = ConceptMap_Group;