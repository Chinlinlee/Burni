"use strict";

module.exports = {
    ...require("./constants"),
    ...require("./diagnostics"),
    ...require("./arrayCorrelation"),
    ...require("./keyPatterns"),
    ...require("./indexPolicy"),
    ...require("./indexManifest"),
    ...require("./indexGenerator"),
    ...require("./indexValidation")
};
