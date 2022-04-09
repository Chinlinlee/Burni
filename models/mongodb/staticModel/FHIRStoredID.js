module.exports = function (mongodb) {
    let FHIRStoredIDSchema = mongodb.Schema({
        id: {
            type: String ,
            default : void 0
        },
        resourceType: {
            type: String ,
            default : void 0
        }
    } , {
        versionKey : false
    });
    FHIRStoredIDSchema.index({
        "id": 1
    });
    FHIRStoredIDSchema.index({
        "resourceType" : 1
    });
    let FHIRStoredID = mongodb.model('FHIRStoredID', FHIRStoredIDSchema, 'FHIRStoredID');
    return FHIRStoredID;
};