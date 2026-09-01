require("module-alias/register");

const path = require("path");
require("dotenv").config({
    path: path.join(__dirname, "../.env")
});

const fs = require("fs");
const mongoose = require("mongoose");
const {
    runTemporalMigration,
    TemporalMigrationPreflightError,
    TemporalMigrationWriteError
} = require("@models/FHIR/searchParameter/migration/temporalMigration");
const {
    runTemporalMigrationPreflight
} = require("@models/FHIR/searchParameter/migration/temporalPreflight");
const {
    BACKUP_REMINDER,
    EXIT_USAGE,
    MODES,
    buildPartialMigrationWarnings,
    formatUsage,
    parseResourceList,
    parseTemporalMigrateArgs,
    resolveConfiguredDatabaseName,
    resolveExitCode,
    resolveReportPath,
    validateTemporalMigrateOptions
} = require("./lib/temporal-migrate-cli");

const FULL_CATALOG = require("@models/FHIR/fhir.resourceList.json");

/**
 * @param {import("mongoose").Model} modelMap
 * @returns {Record<string, import("mongoose").Model>}
 */
function buildMigrationModels(modelMap) {
    return Object.fromEntries(
        Object.entries(modelMap).filter(
            ([, value]) => typeof value === "function" || typeof value === "object"
        )
    );
}

/**
 * @param {object} options
 * @returns {Promise<object>}
 */
async function runPreflightMode(options) {
    return runTemporalMigrationPreflight({
        models: options.models,
        catalog: options.catalog,
        includeHistory: options.includeHistory
    });
}

/**
 * @param {object} options
 * @returns {Promise<object>}
 */
async function runMigrationMode(options) {
    return runTemporalMigration({
        models: options.models,
        catalog: options.catalog,
        includeHistory: options.includeHistory,
        batchSize: options.batchSize,
        logger: console,
        ...(options.dryRun
            ? {
                  updateStrategy: async () => ({
                      acknowledged: true,
                      modifiedCount: 0
                  })
              }
            : {})
    });
}

/**
 * @param {object} input
 * @returns {object}
 */
function buildEvidenceReport(input) {
    const report = {
        kind:
            input.mode === MODES.PREFLIGHT
                ? "temporal-preflight-report"
                : "temporal-migration-report",
        generatedAt: new Date().toISOString(),
        mode: input.mode,
        database: input.database,
        catalog: input.catalog,
        includeHistory: input.includeHistory,
        batchSize: input.batchSize,
        preflight: input.preflight
    };

    if (input.summary) {
        report.summary = input.summary;
    }

    if (input.diagnostics) {
        report.diagnostics = input.diagnostics;
    }

    return report;
}

/**
 * @param {string} reportPath
 * @param {object} report
 */
function writeEvidenceReport(reportPath, report) {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

async function main() {
    const parsed = parseTemporalMigrateArgs(process.argv.slice(2));
    if (parsed.help) {
        console.log(formatUsage());
        return;
    }
    if (parsed.error) {
        console.error(parsed.error);
        console.error(formatUsage());
        process.exitCode = EXIT_USAGE;
        return;
    }

    const options = parsed.options;
    const validation = validateTemporalMigrateOptions(options, process.env);
    if (validation.error) {
        console.error(validation.error);
        console.error(formatUsage());
        process.exitCode = EXIT_USAGE;
        return;
    }

    const catalog = options.resources
        ? parseResourceList(options.resources)
        : FULL_CATALOG;
    for (const warning of buildPartialMigrationWarnings(
        options.mode,
        catalog,
        FULL_CATALOG.length
    )) {
        console.warn(warning);
    }

    const reportPath = resolveReportPath(options.mode, options.reportPath);
    /** @type {object | undefined} */
    let preflight;
    /** @type {object | undefined} */
    let summary;
    /** @type {Error | undefined} */
    let caughtError;

    try {
        const mongodb = require("@mongodb");
        await mongodb.ready;

        const migrationOptions = {
            models: buildMigrationModels(mongodb),
            catalog,
            includeHistory: options.includeHistory,
            batchSize: options.batchSize,
            dryRun: options.mode === MODES.DRY_RUN
        };

        if (options.mode === MODES.PREFLIGHT) {
            preflight = await runPreflightMode(migrationOptions);
        } else {
            if (options.mode === MODES.WRITE) {
                console.warn(`[temporal-migrate] ${BACKUP_REMINDER}`);
            }
            const result = await runMigrationMode(migrationOptions);
            preflight = result.preflight;
            summary = result.summary;
        }
    } catch (error) {
        caughtError = error;
        if (error instanceof TemporalMigrationPreflightError) {
            preflight = error.report;
        }
        if (error instanceof TemporalMigrationWriteError) {
            summary = error.summary;
            preflight = preflight || {
                valid: false,
                summary: error.summary,
                diagnostics: error.diagnostics || []
            };
        }
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }

    const report = buildEvidenceReport({
        mode: options.mode,
        database: resolveConfiguredDatabaseName(process.env) || null,
        catalog,
        includeHistory: options.includeHistory,
        batchSize: options.batchSize,
        preflight,
        summary,
        diagnostics: preflight?.diagnostics
    });
    writeEvidenceReport(reportPath, report);

    console.log(JSON.stringify(report, null, 2));
    console.log(`Wrote evidence report to ${reportPath}`);

    process.exitCode = resolveExitCode({
        preflightValid: preflight?.valid,
        summary,
        error: caughtError
    });
}

main().catch((error) => {
    console.error(error);
    process.exit(resolveExitCode({ error }) || 2);
});
