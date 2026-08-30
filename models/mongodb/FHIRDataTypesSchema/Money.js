const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const decimal = require('../FHIRDataTypesSchema/decimal');
const code = require('../FHIRDataTypesSchema/code');

const {
    Money
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
Money.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    value: decimal,
    currency: code,
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
    _currency: {
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
module.exports.Money = Money;