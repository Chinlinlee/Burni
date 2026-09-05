"use strict";

const {
    auditDuplicateResourceIds,
    evaluateCleanAuditGate,
    runExplicitUniqueIdIndexMigration,
    IdentityMigrationBlockedError
} = require("./identityAuditService");

/**
 * @returns {boolean}
 */
function isIdentityAuditAvailable() {
    return true;
}

module.exports = {
    IdentityMigrationBlockedError,
    isIdentityAuditAvailable,
    auditDuplicateResourceIds,
    evaluateCleanAuditGate,
    runExplicitUniqueIdIndexMigration
};
