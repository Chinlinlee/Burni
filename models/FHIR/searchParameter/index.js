const registryManager = require("./registry/registryManager");

module.exports = {
    ...registryManager,
    compiler: require("./compiler/compiler"),
    executor: {
        mongoExecutor: require("./executor/mongoExecutor"),
        queryValueParser: require("./executor/queryValueParser"),
        temporalQueryParser: require("./executor/temporalQueryParser"),
        temporalQueryFilter: require("./executor/temporalQueryFilter"),
        instantQueryBuilder: require("./executor/instantQueryBuilder"),
        relationPlan: require("./executor/relationPlan"),
        primitives: require("./executor/primitives"),
        queryPrimitives: require("./executor/queryPrimitives")
    },
    indexes: require("./indexes"),
    migration: {
        temporalMigration: require("./migration/temporalMigration"),
        temporalPreflight: require("./migration/temporalPreflight"),
        temporalCutoverGate: require("./migration/temporalCutoverGate"),
        temporalRollout: require("./migration/temporalRollout"),
        migrationContracts: require("./migration/migrationContracts"),
        dualDatabaseOperator: require("./migration/dualDatabaseOperator")
    },
    runtime: {
        registrySearchHandler: require("./runtime/registrySearchHandler")
    }
};
