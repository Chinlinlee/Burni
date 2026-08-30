const { FULL_PROFILE_SPEC } = require("./test/support/test-profiles");

module.exports = {
    diff: true,
    spec: FULL_PROFILE_SPEC,
    package: "./package.json",
    reporter: "spec",
    timeout: "300000",
    ui: "bdd",
    exit: true,
    require: "test/hook.js"
};
