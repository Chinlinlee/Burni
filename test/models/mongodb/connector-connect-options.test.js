require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const {
    buildMongooseConnectOptions,
    disableAutomaticSchemaProvisioning
} = require("@models/mongodb/connector");

describe("MongoDB connector connect options", function () {
    it("disables automatic provisioning on an already-open default connection", function () {
        const previousAutoIndex = mongoose.get("autoIndex");
        const previousAutoCreate = mongoose.get("autoCreate");
        const previousConnectionAutoIndex = mongoose.connection.config.autoIndex;
        const previousConnectionAutoCreate = mongoose.connection.config.autoCreate;

        try {
            mongoose.set({ autoIndex: true, autoCreate: true });
            mongoose.connection.config.autoIndex = true;
            mongoose.connection.config.autoCreate = true;

            disableAutomaticSchemaProvisioning();

            expect(mongoose.get("autoIndex")).to.equal(false);
            expect(mongoose.get("autoCreate")).to.equal(false);
            expect(mongoose.connection.config.autoIndex).to.equal(false);
            expect(mongoose.connection.config.autoCreate).to.equal(false);
        } finally {
            mongoose.set({
                autoIndex: previousAutoIndex,
                autoCreate: previousAutoCreate
            });
            mongoose.connection.config.autoIndex = previousConnectionAutoIndex;
            mongoose.connection.config.autoCreate = previousConnectionAutoCreate;
        }
    });

    it("disables automatic index and collection creation on the default connection", function () {
        const fromUrl = buildMongooseConnectOptions({
            MONGODB_CONNECTION_URL: "mongodb://127.0.0.1:27017/test"
        });

        expect(fromUrl.autoIndex).to.equal(false);
        expect(fromUrl.autoCreate).to.equal(false);
    });

    it("keeps auth options while disabling automatic index and collection creation", function () {
        const fromHosts = buildMongooseConnectOptions({
            MONGODB_AUTH_DB: "admin",
            MONGODB_USER: "lifecycle-user",
            MONGODB_PASSWORD: "super-secret-password"
        });

        expect(fromHosts.autoIndex).to.equal(false);
        expect(fromHosts.autoCreate).to.equal(false);
        expect(fromHosts.authSource).to.equal("admin");
        expect(fromHosts.auth).to.deep.equal({
            authSource: "admin",
            username: "lifecycle-user",
            password: "super-secret-password"
        });
    });
});
