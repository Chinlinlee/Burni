"use strict";

const mongoose = require("mongoose");
const { PROVISIONING_RUN_STATUS } = require("./contracts");
const { ensureControlPlaneOnConnection } = require("./controlPlaneModels");
const { runLockedMongoProvisioning } = require("./provisioningRun");

const STARTUP_PROVISIONING_ENV = "MONGODB_PROVISION_ON_STARTUP";

class MongoProvisioningStartupError extends Error {
    /**
     * @param {import('./types').LockedProvisioningRunResult} result
     */
    constructor(result) {
        const message =
            result.errors.length > 0
                ? result.errors.join("; ")
                : `MongoDB provisioning finished with status ${result.status}`;
        super(`Startup MongoDB provisioning failed: ${message}`);
        this.name = "MongoProvisioningStartupError";
        this.provisioningResult = result;
    }
}

/**
 * @param {string | undefined} value
 * @returns {boolean}
 */
function isStartupProvisioningEnabled(env = process.env) {
    const raw = env?.[STARTUP_PROVISIONING_ENV];
    return raw === "true" || raw === "1";
}

/**
 * @param {Object} [deps]
 * @param {typeof runLockedMongoProvisioning} [deps.runLockedMongoProvisioning]
 * @param {typeof ensureControlPlaneOnConnection} [deps.ensureControlPlaneOnConnection]
 * @returns {(modelMap: Record<string, import("mongoose").Model>) => Promise<import('./types').LockedProvisioningRunResult>}
 */
function createStartupProvisioningReadinessStep(deps = {}) {
    const runProvisioning = deps.runLockedMongoProvisioning || runLockedMongoProvisioning;
    const ensureControlPlane =
        deps.ensureControlPlaneOnConnection || ensureControlPlaneOnConnection;
    const resolveConnection =
        deps.getConnection || (() => mongoose.connection);

    return async function startupProvisioningReadinessStep(modelMap) {
        const connection = resolveConnection();
        if (!connection?.db) {
            throw new Error("MongoDB connection is not ready for startup provisioning");
        }

        const { lockModel, stateModel } = await ensureControlPlane(connection);
        const result = await runProvisioning({
            connection,
            modelMap,
            lockModel,
            stateModel
        });

        if (result.status !== PROVISIONING_RUN_STATUS.SUCCEEDED) {
            throw new MongoProvisioningStartupError(result);
        }

        return result;
    };
}

module.exports = {
    STARTUP_PROVISIONING_ENV,
    MongoProvisioningStartupError,
    isStartupProvisioningEnabled,
    createStartupProvisioningReadinessStep
};
