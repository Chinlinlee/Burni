const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const canonical = require('../FHIRDataTypesSchema/canonical');

const {
    OperationDefinition_Binding
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
OperationDefinition_Binding.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    strength: {
        type: String,
        enum: ["required", "extensible", "preferred", "example"],
        default: void 0
    },
    valueSet: canonical,
    _strength: {
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
module.exports.OperationDefinition_Binding = OperationDefinition_Binding;