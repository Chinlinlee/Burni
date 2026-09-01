module.exports = function (mongodb) {
    const schemaConstructor = mongodb.Schema || mongodb.base.Schema;
    let FHIRStoredIDSchema = schemaConstructor(
        {
            id: {
                type: String,
                default: void 0
            },
            resourceType: {
                type: String,
                default: void 0
            }
        },
        {
            versionKey: false
        }
    );
    FHIRStoredIDSchema.index({
        id: 1
    });
    FHIRStoredIDSchema.index({
        resourceType: 1
    });
    let FHIRStoredID = mongodb.model(
        "FHIRStoredID",
        FHIRStoredIDSchema,
        "FHIRStoredID"
    );
    return FHIRStoredID;
};
