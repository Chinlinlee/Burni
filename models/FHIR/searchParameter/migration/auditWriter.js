/**
 * @param {object} config
 * @returns {import("./migrationContracts").AuditWriter}
 */
function createStubAuditWriter(config) {
    /** @type {import("./migrationContracts").AuditRecord[]} */
    const buffer = [];

    return {
        async append(records) {
            buffer.push(...records);
        },
        async flush() {},
        getArtifactPath() {
            return config.artifactPath;
        }
    };
}

module.exports = {
    createStubAuditWriter
};
