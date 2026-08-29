const registryManager = require("./registry/registryManager");

module.exports = {
    ...registryManager,
    compiler: require("./compiler/compiler"),
    executor: {
        mongoExecutor: require("./executor/mongoExecutor"),
        queryValueParser: require("./executor/queryValueParser"),
        relationPlan: require("./executor/relationPlan"),
        primitives: require("./executor/primitives"),
        queryPrimitives: require("./executor/queryPrimitives")
    },
    runtime: {
        registrySearchHandler: require("./runtime/registrySearchHandler")
    }
};
