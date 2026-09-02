/**
 * @param {import("mongoose")} mongodb
 * @returns {import("mongoose").Model}
 */
module.exports = function (mongodb) {
    const schemaConstructor = mongodb.Schema || mongodb.base.Schema;
    const TemporalMigrationCheckpointSchema = new schemaConstructor(
        {
            runId: {
                type: String,
                required: true
            },
            sourceDatabaseIdentity: {
                type: String,
                required: true
            },
            targetDatabaseIdentity: {
                type: String,
                required: true
            },
            collection: {
                type: String,
                required: true
            },
            batchId: {
                type: String,
                required: true
            },
            status: {
                type: String,
                enum: ["pending", "started", "completed", "failed"],
                required: true
            },
            sourceCount: {
                type: Number,
                default: undefined
            },
            targetCount: {
                type: Number,
                default: undefined
            },
            sourceIds: {
                type: [String],
                default: undefined
            },
            boundary: {
                type: schemaConstructor.Types.Mixed,
                default: undefined
            },
            errorMetadata: {
                type: schemaConstructor.Types.Mixed,
                default: undefined
            }
        },
        {
            versionKey: false,
            timestamps: true,
            suppressReservedKeysWarning: true
        }
    );

    TemporalMigrationCheckpointSchema.index(
        {
            runId: 1,
            collection: 1,
            batchId: 1
        },
        {
            unique: true,
            background: true
        }
    );

    TemporalMigrationCheckpointSchema.index(
        {
            runId: 1,
            collection: 1,
            status: 1
        },
        {
            background: true
        }
    );

    return mongodb.model(
        "TemporalMigrationCheckpoint",
        TemporalMigrationCheckpointSchema,
        "TemporalMigrationCheckpoint"
    );
};
