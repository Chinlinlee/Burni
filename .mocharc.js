module.exports = {
    "diff": true,
    "spec": "test/**/*.test.js",
    "package": "./package.json",
    "reporter": "spec",
    "timeout": "300000",
    "ui": "bdd",
    "exit": true,
    "require": "test/hook.js"
};
