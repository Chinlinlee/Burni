"use strict";

const { searchParameterRegistryReadinessStep } = require("./readinessSteps");
const {
    createStartupProvisioningReadinessStep,
    isStartupProvisioningEnabled
} = require("./provisioning/startupIntegration");

/**
 * @param {NodeJS.ProcessEnv} [env]
 * @param {Object} [overrides]
 * @returns {{ readinessStep?: () => Promise<unknown>, provisioningReadinessStep?: (modelMap: Record<string, import("mongoose").Model>) => Promise<unknown> }}
 */
function resolveConnectorOptions(env = process.env, overrides = {}) {
    /** @type {{ readinessStep?: () => Promise<unknown>, provisioningReadinessStep?: (modelMap: Record<string, import("mongoose").Model>) => Promise<unknown> }} */
    const options = { ...overrides };

    if (!options.readinessStep) {
        options.readinessStep = searchParameterRegistryReadinessStep;
    }

    if (isStartupProvisioningEnabled(env) && !options.provisioningReadinessStep) {
        options.provisioningReadinessStep = createStartupProvisioningReadinessStep(
            overrides.startupProvisioningDeps
        );
    }

    return options;
}

module.exports = {
    resolveConnectorOptions,
    isStartupProvisioningEnabled
};
