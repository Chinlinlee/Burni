/**
 * 
 * @param {import('mongoose')} mongodb 
 * @returns 
 */
module.exports = function (mongodb) {
    let accessItemSchema = mongodb.Schema({
        resourceType: {
            type: String,
            default: void 0
        },
        create: {
            type: mongodb.SchemaTypes.Boolean,
            default: false
        } ,
        delete: {
            type: mongodb.SchemaTypes.Boolean,
            default: false
        },
        read: {
            type: mongodb.SchemaTypes.Boolean,
            default: false
        },
        vread: {
            type: mongodb.SchemaTypes.Boolean,
            default: false
        },
        search: {
            type: mongodb.SchemaTypes.Boolean,
            default: false
        },
        history: {
            type: mongodb.SchemaTypes.Boolean,
            default: false
        }
    }, {
        _id: false,
        id: false,
        versionKey: false
    });

    let issuedTokenSchema = mongodb.Schema({
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
        accessList : {
            type: [accessItemSchema] ,
            default: void 0
        }
    },{
        strict: false,
        versionKey : false,
    });

    issuedTokenSchema.index({
        "resourceType" : 1
    });

    let issuedToken = mongodb.model('issuedToken', issuedTokenSchema, 'issuedToken');
    return issuedToken;
}