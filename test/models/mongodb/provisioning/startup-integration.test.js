require("module-alias/register");

const express = require("express");
const { expect } = require("chai");
const { startServer } = require("../../../../server/bootstrap");
const {
    resolveConnectorOptions,
    isStartupProvisioningEnabled
} = require("@models/mongodb/connectorOptions");
const {
    createStartupProvisioningReadinessStep,
    MongoProvisioningStartupError
} = require("@models/mongodb/provisioning/startupIntegration");
const { PROVISIONING_RUN_STATUS } = require("@models/mongodb/provisioning/contracts");

describe("mongodb startup provisioning integration", function () {
    it("defaults startup provisioning to disabled", function () {
        expect(isStartupProvisioningEnabled({})).to.equal(false);
        expect(isStartupProvisioningEnabled({ MONGODB_PROVISION_ON_STARTUP: "false" })).to.equal(
            false
        );
    });

    it("enables startup provisioning only for explicit truthy env values", function () {
        expect(isStartupProvisioningEnabled({ MONGODB_PROVISION_ON_STARTUP: "true" })).to.equal(
            true
        );
        expect(isStartupProvisioningEnabled({ MONGODB_PROVISION_ON_STARTUP: "1" })).to.equal(true);
    });

    it("does not attach provisioning readiness step by default", function () {
        const options = resolveConnectorOptions({});
        expect(options.provisioningReadinessStep).to.be.undefined;
        expect(options.readinessStep).to.be.a("function");
    });

    it("attaches provisioning readiness step when startup opt-in is enabled", function () {
        const options = resolveConnectorOptions({ MONGODB_PROVISION_ON_STARTUP: "true" });
        expect(options.provisioningReadinessStep).to.be.a("function");
    });

    it("does not listen when startup provisioning readiness fails", async function () {
        let listened = false;
        const app = express();
        const step = createStartupProvisioningReadinessStep({
            getConnection: () => ({ db: { databaseName: "burni-test" } }),
            ensureControlPlaneOnConnection: async () => ({
                lockModel: {},
                stateModel: {}
            }),
            runLockedMongoProvisioning: async () => ({
                status: PROVISIONING_RUN_STATUS.FAILED,
                errors: ["simulated provisioning failure"]
            })
        });

        await startServer(app, {
            readyPromise: step({}),
            configureDatabaseDependentMiddleware: () => {},
            listen: () => {
                listened = true;
            },
            throwOnFailure: true
        }).catch(() => {});

        expect(listened).to.equal(false);
    });

    it("fails startup provisioning when locked run does not succeed", async function () {
        const step = createStartupProvisioningReadinessStep({
            getConnection: () => ({ db: { databaseName: "burni-test" } }),
            ensureControlPlaneOnConnection: async () => ({
                lockModel: {},
                stateModel: {}
            }),
            runLockedMongoProvisioning: async () => ({
                status: PROVISIONING_RUN_STATUS.FAILED,
                errors: ["simulated provisioning failure"]
            })
        });

        let caught = null;
        try {
            await step({});
        } catch (error) {
            caught = error;
        }

        expect(caught).to.be.instanceOf(MongoProvisioningStartupError);
        expect(caught.message).to.include("simulated provisioning failure");
    });
});
