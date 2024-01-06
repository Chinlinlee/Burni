const mongoose = require("mongoose");

let FHIRStoredIDSchema = mongoose.Schema(
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
let FHIRStoredID = mongoose.model(
    "FHIRStoredID",
    FHIRStoredIDSchema,
    "FHIRStoredID"
);

module.exports = FHIRStoredID;