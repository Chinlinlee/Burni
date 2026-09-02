require("module-alias/register");

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const {
    BACKUP_REMINDER,
    EXIT_USAGE,
    MODES,
    buildPartialMigrationWarnings,
    formatUsage,
    parseDualDatabaseTemporalMigrateArgs,
    parseResourceList,
    redactMongoUri,
    resolveAuditPath,
    resolveDatabaseIdentity,
    resolveExitCode,
    resolveReportPath,
    validateDualDatabaseTemporalMigrateOptions
} = require("./lib/dual-database-temporal-migrate-cli");
const {
    DualDatabaseMigrationError,
    DualDatabasePreflightError,
    buildMigrationRunIdentity,
    createDualDatabaseConnections,
    runDualDatabaseDryRun,
    runDualDatabasePreflight,
    runDualDatabaseWrite
} = require("@models/FHIR/searchParameter/migration/dualDatabaseOperator");

const FULL_CATALOG = require("@models/FHIR/fhir.resourceList.json");

/**
 * @param {object} input
 * @returns {object}
 */
function buildEvidenceReport(input) {
    const report = {
        kind:
            input.mode === MODES.PREFLIGHT
                ? "dual-temporal-preflight-report"
                : "dual-temporal-migration-report",
        generatedAt: new Date().toISOString(),
        mode: input.mode,
        sourceDatabase: input.sourceDatabase,
        targetDatabase: input.targetDatabase,
        catalog: input.catalog,
        includeHistory: input.includeHistory,
        batchSize: input.batchSize,
        runIdentity: input.runIdentity,
        preflight: input.preflight
    };

    if (input.summary) {
        report.summary = input.summary;
    }

    if (input.auditPath) {
        report.auditPath = input.auditPath;
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

/**
 * @param {object} options
 * @param {string} sourceDatabaseIdentity
 * @param {string} targetDatabaseIdentity
 * @returns {import("@models/FHIR/searchParameter/migration/migrationContracts").MigrationRunIdentity}
 */
function resolveRunIdentity(options, sourceDatabaseIdentity, targetDatabaseIdentity) {
    return buildMigrationRunIdentity({
        runId: options.runId || `temporal-migration-${crypto.randomUUID()}`,
        sourceDatabaseIdentity,
        targetDatabaseIdentity
    });
}

async function main() {
    const parsed = parseDualDatabaseTemporalMigrateArgs(process.argv.slice(2));
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
    const validation = validateDualDatabaseTemporalMigrateOptions(options);
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
    const auditPath = resolveAuditPath(options.auditPath);
    const sourceDatabase = {
        identity: resolveDatabaseIdentity(options.sourceUri),
        uri: redactMongoUri(options.sourceUri)
    };
    const targetDatabase = {
        identity: resolveDatabaseIdentity(options.targetUri),
        uri: redactMongoUri(options.targetUri)
    };

    /** @type {object | undefined} */
    let preflight;
    /** @type {object | undefined} */
    let summary;
    /** @type {import("@models/FHIR/searchParameter/migration/migrationContracts").MigrationRunIdentity | undefined} */
    let runIdentity;
    /** @type {Error | undefined} */
    let caughtError;

    let connections;
    try {
        connections = await createDualDatabaseConnections({
            sourceUri: options.sourceUri,
            targetUri: options.targetUri
        });

        runIdentity = resolveRunIdentity(
            options,
            connections.sourceDatabaseIdentity,
            connections.targetDatabaseIdentity
        );

        const migrationOptions = {
            sourceConnection: connections.sourceConnection,
            targetConnection: connections.targetConnection,
            catalog,
            includeHistory: options.includeHistory,
            batchSize: options.batchSize,
            runIdentity,
            auditPath,
            logger: console
        };

        if (options.mode === MODES.PREFLIGHT) {
            preflight = await runDualDatabasePreflight({
                sourceConnection: connections.sourceConnection,
                catalog,
                includeHistory: options.includeHistory,
                batchSize: options.batchSize
            });
        } else if (options.mode === MODES.DRY_RUN) {
            const result = await runDualDatabaseDryRun({
                ...migrationOptions,
                runPreflight: true
            });
            preflight = result.preflight;
            summary = result.summary;
        } else {
            console.warn(`[dual-database-temporal-migrate] ${BACKUP_REMINDER}`);
            const result = await runDualDatabaseWrite(migrationOptions);
            preflight = result.preflight;
            summary = result.summary;
        }
    } catch (error) {
        caughtError = error;
        if (error instanceof DualDatabasePreflightError) {
            preflight = error.report;
        }
        if (error instanceof DualDatabaseMigrationError) {
            summary = error.summary;
            preflight = preflight || {
                valid: false,
                summary: error.summary,
                diagnostics: []
            };
        }
    } finally {
        if (connections) {
            await connections.close();
        }
    }

    const report = buildEvidenceReport({
        mode: options.mode,
        sourceDatabase,
        targetDatabase,
        catalog,
        includeHistory: options.includeHistory,
        batchSize: options.batchSize,
        runIdentity,
        preflight,
        summary,
        auditPath: options.mode === MODES.PREFLIGHT ? undefined : auditPath,
        diagnostics: preflight?.diagnostics
    });
    writeEvidenceReport(reportPath, report);

    console.log(JSON.stringify(report, null, 2));
    console.log(`Wrote evidence report to ${reportPath}`);
    if (options.mode !== MODES.PREFLIGHT && auditPath) {
        console.log(`Audit artifact path: ${auditPath}`);
    }

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
