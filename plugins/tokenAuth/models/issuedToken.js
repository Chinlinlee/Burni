const mongoose = require("mongoose");

let accessItemSchema = mongoose.Schema(
    {
        resourceType: {
            type: String,
            default: void 0
        },
        create: {
            type: mongoose.SchemaTypes.Boolean,
            default: false
        },
        delete: {
            type: mongoose.SchemaTypes.Boolean,
            default: false
        },
        read: {
            type: mongoose.SchemaTypes.Boolean,
            default: false
        },
        vread: {
            type: mongoose.SchemaTypes.Boolean,
            default: false
        },
        search: {
            type: mongoose.SchemaTypes.Boolean,
            default: false
        },
        history: {
            type: mongoose.SchemaTypes.Boolean,
            default: false
        }
    },
    {
        _id: false,
        id: false,
        versionKey: false
    }
);

let issuedTokenSchema = mongoose.Schema(
    {
        id: {
            type: String,
            default: void 0
        },
        token: {
            type: String,
            default: void 0
        },
        tokenName: {
            type: String,
            default: void 0
        },
        tokenNote: {
            type: String,
            default: void 0
        },
        scope: {
            type: String,
            default: void 0
        },
        accessList: {
            type: [accessItemSchema],
            default: void 0
        }
    },
    {
        strict: false,
        versionKey: false
    }
);

issuedTokenSchema.index({
    resourceType: 1
});

let issuedToken = mongoose.model(
    "issuedToken",
    issuedTokenSchema,
    "issuedToken"
);

module.exports.issuedTokenModel = issuedToken;
