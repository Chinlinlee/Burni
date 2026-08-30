const { resolveFastProfileFiles } = require("./test/support/test-profiles");

module.exports = {
    diff: true,
    spec: resolveFastProfileFiles(),
    package: "./package.json",
    reporter: "spec",
    timeout: "300000",
    ui: "bdd",
    exit: true,
    require: "test/hook.js"
};
