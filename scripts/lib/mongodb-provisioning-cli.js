"use strict";

const {
    EXIT_SUCCESS,
    EXIT_PROVISION_FAILED,
    EXIT_VERIFY_FAILED,
    EXIT_AUDIT_FAILED,
    EXIT_AUDIT_NOT_AVAILABLE,
    EXIT_CONNECTION_FAILED,
    EXIT_USAGE
} = require("../../models/mongodb/provisioning/operationalCommands");

const USAGE = `Usage:
  npm run mongodb:provision [-- --help]
  npm run mongodb:verify [-- --help]
  npm run mongodb:audit-id [-- --help]

Environment:
  MONGODB_CONNECTION_URL or MONGODB_HOSTS/MONGODB_PORTS/MONGODB_NAME
  MONGODB_PROVISION_ON_STARTUP=true   Enable startup provisioning (application only)
`;

/**
 * @param {string[]} argv
 * @returns {{ help: boolean, error?: string }}
 */
function parseMongoProvisioningArgs(argv) {
    const options = {
        help: false
    };

    for (const arg of argv) {
        if (arg === "--help" || arg === "-h") {
            options.help = true;
            continue;
        }
        return {
            help: false,
            error: `Unknown argument: ${arg}`
        };
    }

    return options;
}

/**
 * @param {number} exitCode
 * @returns {number}
 */
function normalizeExitCode(exitCode) {
    if (typeof exitCode !== "number" || Number.isNaN(exitCode)) {
        return EXIT_PROVISION_FAILED;
    }
    return exitCode;
}

/**
 * @param {Object} input
 * @returns {number}
 */
function resolveProvisionExitCode(input) {
    if (input.error) {
        return EXIT_USAGE;
    }
    return normalizeExitCode(input.exitCode);
}

/**
 * @param {Object} input
 * @returns {number}
 */
function resolveVerifyExitCode(input) {
    if (input.error) {
        return EXIT_USAGE;
    }
    return normalizeExitCode(input.exitCode ?? EXIT_VERIFY_FAILED);
}

/**
 * @param {Object} input
 * @returns {number}
 */
function resolveAuditExitCode(input) {
    if (input.error) {
        return EXIT_USAGE;
    }
    return normalizeExitCode(input.exitCode ?? EXIT_AUDIT_FAILED);
}

module.exports = {
    EXIT_SUCCESS,
    EXIT_PROVISION_FAILED,
    EXIT_VERIFY_FAILED,
    EXIT_AUDIT_FAILED,
    EXIT_AUDIT_NOT_AVAILABLE,
    EXIT_CONNECTION_FAILED,
    EXIT_USAGE,
    USAGE,
    parseMongoProvisioningArgs,
    resolveProvisionExitCode,
    resolveVerifyExitCode,
    resolveAuditExitCode
};
