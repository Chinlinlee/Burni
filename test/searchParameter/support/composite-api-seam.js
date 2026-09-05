const { expect } = require("chai");

const COMPOSITE_COMPILER_MODULE =
    "@models/FHIR/searchParameter/compiler/compositeCompiler";

/**
 * @param {string} modulePath
 * @returns {Record<string, unknown> | null}
 */
function tryLoadModule(modulePath) {
    try {
        return require(modulePath);
    } catch (error) {
        if (error && typeof error === "object" && "code" in error && error.code === "MODULE_NOT_FOUND") {
            return null;
        }
        throw error;
    }
}

/**
 * @returns {boolean}
 */
function isCompositeCompilerAvailable() {
    return tryLoadModule(COMPOSITE_COMPILER_MODULE) !== null;
}

/**
 * @returns {Record<string, unknown> | null}
 */
function loadCompositeCompilerModule() {
    return tryLoadModule(COMPOSITE_COMPILER_MODULE);
}

/**
 * @param {string} title
 * @param {(getModule: () => Record<string, unknown>) => void} defineTests
 */
function describeWhenCompositeCompilerAvailable(title, defineTests) {
    describe(title, function () {
        /** @type {Record<string, unknown> | null} */
        let moduleApi = null;

        before(function () {
            moduleApi = loadCompositeCompilerModule();
            if (!moduleApi) {
                this.skip();
            }
        });

        defineTests(() => {
            if (!moduleApi) {
                throw new Error("Composite compiler module is not available");
            }
            return moduleApi;
        });
    });
}

module.exports = {
    COMPOSITE_COMPILER_MODULE,
    isCompositeCompilerAvailable,
    loadCompositeCompilerModule,
    describeWhenCompositeCompilerAvailable
};
