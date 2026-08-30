require("module-alias/register");
const { stopMongoMemoryProcess } = require("./support/mongo-memory");
const timing = require("./support/test-timing");

module.exports.mochaHooks = async () => {
    return {
        beforeAll: (done) => {
            timing.startPhase("process.hook.setup");
            timing.endPhase("process.hook.setup");
            done();
        },
        afterAll: async () => {
            timing.startPhase("process.teardown");
            await stopMongoMemoryProcess();
            timing.endPhase("process.teardown");
            timing.printSummary();
        },
        beforeEach: function () {
            const suite = this.currentTest?.parent;
            if (suite) {
                timing.onSuiteBegin(suite);
            }
            timing.onTestBegin();
        },
        afterEach: function () {
            timing.onTestEnd();
        }
    };
};
