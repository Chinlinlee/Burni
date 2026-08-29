const { reloadRegistry } = require("../registry/registryManager");
const { logger } = require("@root/utils/log");

/**
 * @returns {Promise<void>}
 */
async function reloadSearchParameterRegistry() {
    try {
        await reloadRegistry();
    } catch (error) {
        logger.error(
            `[SearchParameter registry] reload failed: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
    }
}

module.exports = {
    reloadSearchParameterRegistry
};
