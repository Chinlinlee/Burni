module.exports = function (mongodb) {
    let FHIRValidationFilesSchema = mongodb.Schema({
        url: {
            type: String,
            default: void 0
        },
        hash: {
            type: String ,
            default : void 0
        },
        path: {
            type: String,
            default : void 0
        },
        id: {
            type: String,
            default : void 0
        }
    } , {
        versionKey : false
    });
    FHIRValidationFilesSchema.index({
        "url": 1,
        "hash": 1
    }, {
        background: true
    });
    FHIRValidationFilesSchema.index({
        "id": 1
    }, {
        background: true
    });
    let FHIRValidationFilesModel = mongodb.model('FHIRValidationFiles', FHIRValidationFilesSchema, 'FHIRValidationFiles');
    return FHIRValidationFilesModel;
};