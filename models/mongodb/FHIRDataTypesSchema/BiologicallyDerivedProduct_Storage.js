const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const string = require('../FHIRDataTypesSchema/string');
const decimal = require('../FHIRDataTypesSchema/decimal');
const {
    Period
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    BiologicallyDerivedProduct_Storage
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
BiologicallyDerivedProduct_Storage.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    description: string,
    temperature: decimal,
    scale: {
        type: String,
        enum: ["farenheit", "celsius", "kelvin"],
        default: void 0
    },
    duration: {
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
    _temperature: {
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
    _scale: {
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
module.exports.BiologicallyDerivedProduct_Storage = BiologicallyDerivedProduct_Storage;