"use strict";

const path = require("path");

const EXIT_SUCCESS = 0;
const EXIT_PREFLIGHT_FAILED = 1;
const EXIT_WRITE_FAILED = 2;
const EXIT_USAGE = 64;

const MODES = Object.freeze({
    PREFLIGHT: "preflight-only",
    DRY_RUN: "dry-run",
    WRITE: "write"
});

const BACKUP_REMINDER =
    "Create a verified backup before writing. See docs/temporal-migration-backup-restore.md";

/**
 * @param {string[]} argv
 * @returns {{ options?: object, error?: string, help?: boolean }}
 */
function parseTemporalMigrateArgs(argv) {
    /** @type {'preflight-only' | 'dry-run' | 'write' | null} */
    let mode = null;
    const options = {
        batchSize: 100,
        includeHistory: true,
        resources: null,
        confirmDb: null,
        reportPath: null
    };

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];

        switch (arg) {
            case "--preflight-only":
                if (mode && mode !== MODES.PREFLIGHT) {
                    return {
                        error: "Only one of --preflight-only, --dry-run, or --write may be specified"
                    };
                }
                mode = MODES.PREFLIGHT;
                break;
            case "--dry-run":
                if (mode && mode !== MODES.DRY_RUN) {
                    return {
                        error: "Only one of --preflight-only, --dry-run, or --write may be specified"
                    };
                }
                mode = MODES.DRY_RUN;
                break;
            case "--write":
                if (mode && mode !== MODES.WRITE) {
                    return {
                        error: "Only one of --preflight-only, --dry-run, or --write may be specified"
                    };
                }
                mode = MODES.WRITE;
                break;
            case "--skip-history":
                options.includeHistory = false;
                break;
            case "--resource": {
                const value = argv[index + 1];
                if (!value || value.startsWith("-")) {
                    return { error: "--resource requires a comma-separated resource list" };
                }
                options.resources = value;
                index += 1;
                break;
            }
            case "--batch-size": {
                const value = argv[index + 1];
                if (!value || value.startsWith("-")) {
                    return { error: "--batch-size requires a positive integer" };
                }
                options.batchSize = Number(value);
                index += 1;
                break;
            }
            case "--confirm-db": {
                const value = argv[index + 1];
                if (!value || value.startsWith("-")) {
                    return { error: "--confirm-db requires a database name" };
                }
                options.confirmDb = value;
                index += 1;
                break;
            }
            case "--report": {
                const value = argv[index + 1];
                if (!value || value.startsWith("-")) {
                    return { error: "--report requires a file path" };
                }
                options.reportPath = value;
                index += 1;
                break;
            }
            case "--help":
            case "-h":
                return { help: true };
            default:
                return { error: `Unknown argument: ${arg}` };
        }
    }

    return {
        options: {
            ...options,
            mode: mode || MODES.PREFLIGHT
        }
    };
}

/**
 * @param {object} options
 * @param {NodeJS.ProcessEnv} env
 * @returns {{ error?: string }}
 */
function validateTemporalMigrateOptions(options, env) {
    if (!Number.isInteger(options.batchSize) || options.batchSize <= 0) {
        return { error: "--batch-size must be a positive integer" };
    }

    if (options.resources) {
        const resources = parseResourceList(options.resources);
        if (resources.length === 0) {
            return { error: "--resource must list at least one resource type" };
        }
    }

    if (options.mode === MODES.WRITE) {
        if (!options.confirmDb) {
            return { error: "--write requires --confirm-db <database-name>" };
        }
        const configuredDb = env.MONGODB_NAME;
        if (!configuredDb) {
            return { error: "MONGODB_NAME must be set when using --write" };
        }
        if (options.confirmDb !== configuredDb) {
            return {
                error: `--confirm-db "${options.confirmDb}" does not match MONGODB_NAME "${configuredDb}"`
            };
        }
    }

    if (options.confirmDb && options.mode !== MODES.WRITE) {
        return { error: "--confirm-db is only valid with --write" };
    }

    return {};
}

/**
 * @param {string} resources
 * @returns {string[]}
 */
function parseResourceList(resources) {
    return resources
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);
}

/**
 * @param {string} mode
 * @param {string | null | undefined} reportPath
 * @param {Date} [now]
 * @returns {string}
 */
function resolveReportPath(mode, reportPath, now = new Date()) {
    if (reportPath) {
        return reportPath;
    }

    const stamp = now.toISOString().replace(/[:.]/g, "-");
    const prefix =
        mode === MODES.PREFLIGHT ? "temporal-preflight" : "temporal-migration";
    return path.join("evidence", `${prefix}-${stamp}.json`);
}

/**
 * @param {string} mode
 * @param {string[]} catalog
 * @param {number} fullCatalogCount
 * @returns {string[]}
 */
function buildPartialMigrationWarnings(mode, catalog, fullCatalogCount) {
    if (catalog.length >= fullCatalogCount) {
        return [];
    }

    return [
        `[temporal-migrate] partial ${mode} for ${catalog.length}/${fullCatalogCount} resource types (${catalog.join(", ")}). Production rollout must preflight the full catalog.`
    ];
}

/**
 * @param {object} input
 * @param {boolean | undefined} input.preflightValid
 * @param {object | undefined} input.summary
 * @param {Error | undefined} input.error
 * @returns {number}
 */
function resolveExitCode({ preflightValid, summary, error }) {
    if (error && error.code === "TEMPORAL_MIGRATE_USAGE") {
        return EXIT_USAGE;
    }
    if (
        error?.name === "TemporalMigrationPreflightError" ||
        preflightValid === false
    ) {
        return EXIT_PREFLIGHT_FAILED;
    }
    if (
        error?.name === "TemporalMigrationWriteError" ||
        (summary && summary.failed > 0)
    ) {
        return EXIT_WRITE_FAILED;
    }
    if (error) {
        return EXIT_WRITE_FAILED;
    }
    return EXIT_SUCCESS;
}

function formatUsage() {
    return `Usage: node scripts/temporal-migrate.js [options]

Modes (default: --preflight-only):
  --preflight-only   Read-only temporal preflight scan
  --dry-run          Run conversion without writing updates
  --write            Write canonical temporal objects (requires --confirm-db)

Options:
  --confirm-db <name>     Required with --write; must match MONGODB_NAME
  --resource <a,b,...>    Limit migration to specific resource types
  --skip-history          Skip *_history collections
  --batch-size <n>        Batch size for migration (default: 100)
  --report <path>         Evidence report path (default: ./evidence/temporal-*.json)
  -h, --help              Show this help

Exit codes:
  0   Success
  1   Preflight gate failed
  2   Migration write failed
  64  Usage error`;
}

module.exports = {
    BACKUP_REMINDER,
    EXIT_PREFLIGHT_FAILED,
    EXIT_SUCCESS,
    EXIT_USAGE,
    EXIT_WRITE_FAILED,
    MODES,
    buildPartialMigrationWarnings,
    formatUsage,
    parseResourceList,
    parseTemporalMigrateArgs,
    resolveExitCode,
    resolveReportPath,
    validateTemporalMigrateOptions
};
