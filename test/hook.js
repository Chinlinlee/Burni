require("module-alias/register");
module.exports.mochaHooks = async () => {
    return {
        beforeAll: (done) => {
            done();
        }
    };
};