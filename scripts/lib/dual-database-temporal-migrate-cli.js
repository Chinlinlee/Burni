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
 * @param {string} uri
 * @returns {{ host: string, databaseName: string } | null}
 */
function parseMongoUriParts(uri) {
    if (!uri) {
        return null;
    }

    try {
        const isSrv = /^mongodb\+srv:\/\//.test(uri);
        const normalized = uri.replace(/^mongodb(?:\+srv)?:\/\//, "http://");
        const url = new URL(normalized);
        const host = url.host;
        const pathname = url.pathname.replace(/^\//, "");
        const databaseName = pathname.split("/")[0] || "";
        if (!host || !databaseName) {
            return isSrv && host && !databaseName ? { host, databaseName: "" } : null;
        }
        return { host, databaseName };
    } catch {
        return null;
    }
}

/**
 * @param {string} uri
 * @returns {string | undefined}
 */
function resolveDatabaseNameFromUri(uri) {
    const parts = parseMongoUriParts(uri);
    return parts?.databaseName || undefined;
}

/**
 * @param {string} uri
 * @returns {string | undefined}
 */
function resolveDatabaseIdentity(uri) {
    const parts = parseMongoUriParts(uri);
    if (!parts?.host) {
        return undefined;
    }
    if (!parts.databaseName) {
        return parts.host;
    }
    return `${parts.host}/${parts.databaseName}`;
}

/**
 * @param {string} uri
 * @returns {string}
 */
function redactMongoUri(uri) {
    if (!uri) {
        return "<redacted-empty-uri>";
    }

    try {
        const isSrv = /^mongodb\+srv:\/\//.test(uri);
        const normalized = uri.replace(/^mongodb(?:\+srv)?:\/\//, "http://");
        const url = new URL(normalized);
        const protocol = isSrv ? "mongodb+srv://" : "mongodb://";
        return `${protocol}${url.host}${url.pathname}${url.search}`;
    } catch {
        return "<redacted-invalid-uri>";
    }
}

/**
 * @param {string} text
 * @returns {string}
 */
function redactMongoUrisInText(text) {
    return String(text).replace(/mongodb(?:\+srv)?:\/\/\S+/g, (uri) =>
        redactMongoUri(uri.replace(/[.,;:]+$/u, ""))
    );
}

/**
 * @param {unknown} error
 * @returns {{ name: string, message: string, code?: unknown } | undefined}
 */
function serializeCaughtError(error) {
    if (!error) {
        return undefined;
    }

    const serialized = {
        name: error instanceof Error && error.name ? error.name : "Error",
        message: redactMongoUrisInText(
            error instanceof Error ? error.message : String(error)
        )
    };

    if (error instanceof Error && "code" in error && error.code !== undefined) {
        serialized.code = error.code;
    }

    return serialized;
}

/**
 * @param {string} sourceUri
 * @param {string} targetUri
 * @returns {boolean}
 */
function databasesAreSame(sourceUri, targetUri) {
    const source = parseMongoUriParts(sourceUri);
    const target = parseMongoUriParts(targetUri);
    if (!source?.host || !source.databaseName || !target?.host || !target.databaseName) {
        return false;
    }
    return (
        source.host.toLowerCase() === target.host.toLowerCase() &&
        source.databaseName === target.databaseName
    );
}

/**
 * @param {string[]} argv
 * @returns {{ options?: object, error?: string, help?: boolean }}
 */
function parseDualDatabaseTemporalMigrateArgs(argv) {
    /** @type {'preflight-only' | 'dry-run' | 'write' | null} */
    let mode = null;
    const options = {
        sourceUri: null,
        targetUri: null,
        batchSize: 100,
        includeHistory: true,
        resources: null,
        confirmTarget: null,
        reportPath: null,
        auditPath: null,
        runId: null
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
            case "--source-uri": {
                const value = argv[index + 1];
                if (!value || value.startsWith("-")) {
                    return { error: "--source-uri requires a MongoDB connection URI" };
                }
                options.sourceUri = value;
                index += 1;
                break;
            }
            case "--target-uri": {
                const value = argv[index + 1];
                if (!value || value.startsWith("-")) {
                    return { error: "--target-uri requires a MongoDB connection URI" };
                }
                options.targetUri = value;
                index += 1;
                break;
            }
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
            case "--confirm-target": {
                const value = argv[index + 1];
                if (!value || value.startsWith("-")) {
                    return { error: "--confirm-target requires a database name" };
                }
                options.confirmTarget = value;
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
            case "--audit": {
                const value = argv[index + 1];
                if (!value || value.startsWith("-")) {
                    return { error: "--audit requires a file path" };
                }
                options.auditPath = value;
                index += 1;
                break;
            }
            case "--run-id": {
                const value = argv[index + 1];
                if (!value || value.startsWith("-")) {
                    return { error: "--run-id requires a non-empty run identifier" };
                }
                options.runId = value;
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
 * @returns {{ error?: string }}
 */
function validateDualDatabaseTemporalMigrateOptions(options) {
    if (!options.sourceUri) {
        return { error: "--source-uri is required" };
    }
    if (!options.targetUri) {
        return { error: "--target-uri is required" };
    }

    if (!Number.isInteger(options.batchSize) || options.batchSize <= 0) {
        return { error: "--batch-size must be a positive integer" };
    }

    if (options.resources) {
        const resources = parseResourceList(options.resources);
        if (resources.length === 0) {
            return { error: "--resource must list at least one resource type" };
        }
    }

    if (!resolveDatabaseNameFromUri(options.sourceUri)) {
        return {
            error: "--source-uri must include a database name in the connection path"
        };
    }

    if (databasesAreSame(options.sourceUri, options.targetUri)) {
        return {
            error: "Source and target URIs resolve to the same database identity"
        };
    }

    const targetDatabaseName = resolveDatabaseNameFromUri(options.targetUri);
    if (!targetDatabaseName) {
        return {
            error: "--target-uri must include a database name in the connection path"
        };
    }

    if (options.mode === MODES.WRITE) {
        if (!options.confirmTarget) {
            return { error: "--write requires --confirm-target <database-name>" };
        }
        if (options.confirmTarget !== targetDatabaseName) {
            return {
                error: `--confirm-target "${options.confirmTarget}" does not match target database "${targetDatabaseName}"`
            };
        }
    }

    if (options.confirmTarget && options.mode !== MODES.WRITE) {
        return { error: "--confirm-target is only valid with --write" };
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
        mode === MODES.PREFLIGHT ? "dual-temporal-preflight" : "dual-temporal-migration";
    return path.join("evidence", `${prefix}-${stamp}.json`);
}

/**
 * @param {string | null | undefined} auditPath
 * @param {Date} [now]
 * @returns {string}
 */
function resolveAuditPath(auditPath, now = new Date()) {
    if (auditPath) {
        return auditPath;
    }

    const stamp = now.toISOString().replace(/[:.]/g, "-");
    return path.join("evidence", `dual-temporal-audit-${stamp}.jsonl`);
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
        `[dual-database-temporal-migrate] partial ${mode} for ${catalog.length}/${fullCatalogCount} resource types (${catalog.join(", ")}). Production rollout must preflight the full catalog.`
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
    if (
        error &&
        (error.code === "DUAL_DATABASE_TEMPORAL_MIGRATE_USAGE" ||
            error.code === "TEMPORAL_MIGRATE_USAGE")
    ) {
        return EXIT_USAGE;
    }
    if (
        error?.name === "DualDatabasePreflightError" ||
        error?.name === "TemporalMigrationPreflightError" ||
        preflightValid === false
    ) {
        return EXIT_PREFLIGHT_FAILED;
    }
    if (
        error?.name === "DualDatabaseMigrationError" ||
        error?.name === "TemporalMigrationWriteError" ||
        (summary && summary.failed > 0) ||
        (summary && summary.status === "incomplete") ||
        (summary && summary.batchesFailed > 0)
    ) {
        return EXIT_WRITE_FAILED;
    }
    if (error) {
        return EXIT_WRITE_FAILED;
    }
    return EXIT_SUCCESS;
}

function formatUsage() {
    return `Usage: node scripts/dual-database-temporal-migrate.js [options]

Modes (default: --preflight-only):
  --preflight-only   Read-only temporal preflight scan against source database
  --dry-run          Run conversion without writing to target database
  --write            Write canonical temporal objects to target (requires --confirm-target)

Required:
  --source-uri <uri>      Temporal source MongoDB URI (read-only)
  --target-uri <uri>      Temporal target MongoDB URI (write in --write mode)

Options:
  --confirm-target <name> Required with --write; must match target URI database name
  --resource <a,b,...>    Limit migration to specific resource types
  --skip-history          Skip *_history collections
  --batch-size <n>        Batch size for migration (default: 100)
  --report <path>         Evidence report path (default: ./evidence/dual-temporal-*.json)
  --audit <path>          Lossy conversion audit path (default: ./evidence/dual-temporal-audit-*.jsonl)
  --run-id <id>           Migration run identifier (default: generated)
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
    databasesAreSame,
    formatUsage,
    parseDualDatabaseTemporalMigrateArgs,
    parseResourceList,
    redactMongoUri,
    serializeCaughtError,
    resolveAuditPath,
    resolveDatabaseIdentity,
    resolveDatabaseNameFromUri,
    resolveExitCode,
    resolveReportPath,
    validateDualDatabaseTemporalMigrateOptions
};
