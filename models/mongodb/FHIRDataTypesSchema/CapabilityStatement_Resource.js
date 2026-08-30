const mongoose = require('mongoose');
const {
    Extension
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const code = require('../FHIRDataTypesSchema/code');
const canonical = require('../FHIRDataTypesSchema/canonical');
const markdown = require('../FHIRDataTypesSchema/markdown');
const {
    CapabilityStatement_Interaction
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const boolean = require('../FHIRDataTypesSchema/boolean');
const string = require('../FHIRDataTypesSchema/string');
const {
    CapabilityStatement_SearchParam
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');
const {
    CapabilityStatement_Operation
} = require('../FHIRDataTypesSchemaExport/allTypeSchemaTopDef');

const {
    CapabilityStatement_Resource
} = require("../FHIRDataTypesSchemaExport/allTypeSchemaTopDef");
CapabilityStatement_Resource.add({
    extension: {
        type: [Extension],
        default: void 0
    },
    modifierExtension: {
        type: [Extension],
        default: void 0
    },
    type: code,
    profile: canonical,
    supportedProfile: {
        type: [canonical],
        default: void 0
    },
    documentation: markdown,
    interaction: {
        type: [CapabilityStatement_Interaction],
        default: void 0
    },
    versioning: {
        type: String,
        enum: ["no-version", "versioned", "versioned-update"],
        default: void 0
    },
    readHistory: boolean,
    updateCreate: boolean,
    conditionalCreate: boolean,
    conditionalRead: {
        type: String,
        enum: ["not-supported", "modified-since", "not-match", "full-support"],
        default: void 0
    },
    conditionalUpdate: boolean,
    conditionalDelete: {
        type: String,
        enum: ["not-supported", "single", "multiple"],
        default: void 0
    },
    referencePolicy: {
        type: [String],
        default: void 0
    },
    searchInclude: {
        type: [string],
        default: void 0
    },
    searchRevInclude: {
        type: [string],
        default: void 0
    },
    searchParam: {
        type: [CapabilityStatement_SearchParam],
        default: void 0
    },
    operation: {
        type: [CapabilityStatement_Operation],
        default: void 0
    },
    _type: {
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
    _documentation: {
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
    _versioning: {
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
    _readHistory: {
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
    _updateCreate: {
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
    _conditionalCreate: {
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
    _conditionalRead: {
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
    _conditionalUpdate: {
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
    _conditionalDelete: {
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
    _referencePolicy: {
        type: [new mongoose.Schema({
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
        })],
        default: void 0
    },
    _searchInclude: {
        type: [new mongoose.Schema({
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
        })],
        default: void 0
    },
    _searchRevInclude: {
        type: [new mongoose.Schema({
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
        })],
        default: void 0
    }
});
module.exports.CapabilityStatement_Resource = CapabilityStatement_Resource;