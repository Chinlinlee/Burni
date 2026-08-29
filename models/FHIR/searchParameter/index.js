const registryManager = require("./registry/registryManager");
const featureFlags = require("./config/featureFlags");

module.exports = {
    ...registryManager,
    ...featureFlags,
    compiler: require("./compiler/compiler"),
    executor: {
        mongoExecutor: require("./executor/mongoExecutor"),
        queryValueParser: require("./executor/queryValueParser"),
        relationPlan: require("./executor/relationPlan"),
        primitives: require("./executor/primitives")
    },
    runtime: {
        registrySearchHandler: require("./runtime/registrySearchHandler"),
        shadowComparison: require("./runtime/shadowComparison")
    }
};
