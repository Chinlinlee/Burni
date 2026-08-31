const {
    TEMPORAL_CATEGORIES
} = require("./temporalPreflight");
const {
    validateTemporalIndexManifest
} = require("../indexes/indexValidation");
const {
    validateTemporalIndexCompatibility
} = require("../indexes/indexCompatibility");

const GATE_KIND = "fhir-temporal-cutover-completion-gate";
const GATE_VERSION = 1;
const BACKUP_RESTORE_DOCUMENT = "docs/temporal-migration-backup-restore.md";
const COMPLETED_MIGRATION_STATUSES = new Set([
    "complete",
    "completed",
    "succeeded",
    "success"
]);
const UNRESOLVED_PREFLIGHT_CATEGORIES = new Set([
    TEMPORAL_CATEGORIES.INVALID,
    TEMPORAL_CATEGORIES.AMBIGUOUS_BSON_DATE
]);

function diagnostic(code, message, details = {}) {
    return { code, message, ...details };
}

function resultObject(result) {
    if (result && typeof result === "object" && !Array.isArray(result)) {
        return result;
    }
    return {};
}

function unwrapResult(result) {
    const object = resultObject(result);
    if (object.result && typeof object.result === "object") {
        return object.result;
    }
    return object;
}

function normalizeVerificationResult(result, code, message) {
    if (result === true) {
        return { valid: true, diagnostics: [] };
    }
    if (result && typeof result === "object" && !Array.isArray(result)) {
        const valid =
            typeof result.valid === "boolean"
                ? result.valid
                : typeof result.passed === "boolean"
                  ? result.passed
                  : undefined;
        if (valid !== undefined) {
            return {
                ...result,
                valid,
                diagnostics: Array.isArray(result.diagnostics)
                    ? result.diagnostics
                    : []
            };
        }
    }
    return {
        valid: false,
        diagnostics: [diagnostic(code, message)]
    };
}

function buildProviderInput(candidate, context, field) {
    const object = resultObject(candidate);
    return {
        ...object,
        ...context,
        field,
        value: candidate,
        result: candidate,
        [field]: candidate
    };
}

async function resolveProvider(provider, candidate, context, field) {
    if (typeof provider === "function") {
        return provider(buildProviderInput(candidate, context, field));
    }
    return candidate;
}

function validateMigrationCompletion(status) {
    const candidate = unwrapResult(status);
    const diagnostics = [];
    const summary = resultObject(candidate.summary);
    const failed =
        Number(candidate.failed || summary.failed || candidate.failedBatches || 0);
    const explicitFailure =
        candidate.ok === false ||
        candidate.failed === true ||
        candidate.complete === false ||
        candidate.completed === false ||
        candidate.status === "failed" ||
        candidate.status === "aborted";
    const statusComplete =
        candidate.complete === true ||
        candidate.completed === true ||
        COMPLETED_MIGRATION_STATUSES.has(candidate.status);
    const summaryComplete =
        candidate.summary &&
        Number.isFinite(failed) &&
        failed === 0 &&
        candidate.status !== "planned";

    if (explicitFailure || failed > 0) {
        diagnostics.push(
            diagnostic(
                "temporal-migration-incomplete",
                "Temporal migration did not complete successfully",
                { failed }
            )
        );
    }
    if (!statusComplete && !summaryComplete && !explicitFailure) {
        diagnostics.push(
            diagnostic(
                "temporal-migration-completion-missing",
                "Temporal migration completion status is required"
            )
        );
    }

    return {
        valid: diagnostics.length === 0,
        diagnostics,
        status: candidate.status,
        summary
    };
}

function getPreflightReport(result) {
    const candidate = unwrapResult(result);
    if (candidate.report && typeof candidate.report === "object") {
        return candidate.report;
    }
    return candidate;
}

function validatePreflightCompletion(result) {
    const report = getPreflightReport(result);
    const summary = resultObject(report.summary);
    const invalid = Number(summary.invalid || 0);
    const ambiguous = Number(summary.ambiguousBsonDates || 0);
    const unavailable = Math.max(
        Number(summary.unavailableSources || 0),
        Array.isArray(report.sources)
            ? report.sources.filter((source) => source?.available === false).length
            : 0,
        Array.isArray(report.diagnostics)
            ? report.diagnostics.filter(
                  (entry) =>
                      entry?.category === "unavailable-source" ||
                      entry?.code === "temporal-preflight-source-unavailable"
              ).length
            : 0
    );
    const diagnostics = [
        ...(Array.isArray(report.diagnostics) ? report.diagnostics : []),
        ...(Array.isArray(report.unresolvedDiagnostics)
            ? report.unresolvedDiagnostics
            : [])
    ];
    const unresolvedDiagnostics = diagnostics.filter((entry) =>
        UNRESOLVED_PREFLIGHT_CATEGORIES.has(entry?.category) ||
        entry?.unresolved === true ||
        entry?.resolved === false ||
        /(?:invalid|ambiguous)/i.test(String(entry?.code || ""))
    );
    const gateDiagnostics = [];

    if (report.valid !== true) {
        gateDiagnostics.push(
            diagnostic(
                "temporal-preflight-invalid",
                "Temporal migration preflight is not valid",
                { summary }
            )
        );
    }
    if (invalid > 0 || ambiguous > 0 || unavailable > 0) {
        gateDiagnostics.push(
            diagnostic(
                "temporal-preflight-unresolved-data",
                "Temporal preflight contains unresolved invalid, ambiguous, or unavailable data",
                { invalid, ambiguous, unavailable }
            )
        );
    }
    if (unresolvedDiagnostics.length > 0) {
        gateDiagnostics.push(...unresolvedDiagnostics);
    }

    return {
        valid: gateDiagnostics.length === 0,
        diagnostics: gateDiagnostics,
        summary,
        unresolvedDiagnostics
    };
}

function validateBackupRestoreability(result) {
    const candidate = unwrapResult(result);
    const restorable =
        candidate.restorable === true ||
        candidate.restoreable === true ||
        candidate.recoverable === true ||
        candidate.restore?.restorable === true ||
        candidate.restore?.verified === true ||
        candidate.verification?.restorable === true;
    const diagnostics = [];

    if (candidate.valid === false || candidate.ok === false || candidate.failed === true) {
        diagnostics.push(
            diagnostic(
                "temporal-backup-verification-failed",
                "Backup or snapshot verification failed"
            )
        );
    }
    if (!restorable) {
        diagnostics.push(
            diagnostic(
                "temporal-backup-restoreability-missing",
                "A verified restorable backup or snapshot is required"
            )
        );
    }

    return {
        valid: diagnostics.length === 0,
        diagnostics,
        restorable,
        backupId: candidate.backupId,
        snapshotId: candidate.snapshotId
    };
}

async function verifyIndexGate({
    manifest,
    plans = [],
    requirePlans = false,
    indexVerification,
    indexVerifier,
    context
}) {
    const manifestResult = validateTemporalIndexManifest(manifest, {
        plans,
        requirePlans
    });
    const compatibilityResult = validateTemporalIndexCompatibility(manifest, {
        plans,
        requirePlans
    });
    const diagnostics = [
        ...manifestResult.errors.map((message) =>
            diagnostic("temporal-index-manifest-invalid", message)
        ),
        ...(compatibilityResult.diagnostics || [])
    ];
    let explainResult;

    if (typeof indexVerifier === "function") {
        explainResult = normalizeVerificationResult(
            await indexVerifier({
                ...context,
                manifest,
                plans,
                indexVerification,
                readOnly: true
            }),
            "temporal-index-explain-invalid",
            "The injected temporal index verifier did not return a valid result"
        );
    } else {
        const configured = unwrapResult(indexVerification);
        if (
            configured.valid !== undefined ||
            configured.passed !== undefined
        ) {
            explainResult = normalizeVerificationResult(
                configured,
                "temporal-index-explain-invalid",
                "The configured temporal explain result is invalid"
            );
        } else {
            explainResult = {
                valid: false,
                diagnostics: [
                    diagnostic(
                        "temporal-index-explain-result-missing",
                        "A verified temporal index explain result is required"
                    )
                ]
            };
        }
    }

    diagnostics.push(...explainResult.diagnostics);
    return {
        valid:
            manifestResult.valid &&
            compatibilityResult.valid &&
            explainResult.valid &&
            diagnostics.length === 0,
        diagnostics,
        manifest: manifestResult,
        compatibility: compatibilityResult,
        explain: explainResult
    };
}

function buildRollbackRecommendation(valid, backup) {
    if (valid) {
        return {
            required: false,
            action: "保留 backup/snapshot 直到 cutover health check 完成",
            backupRestoreDocument: BACKUP_RESTORE_DOCUMENT
        };
    }
    return {
        required: true,
        action:
            "停止 schema cutover 與 legacy fallback removal；若已寫入資料，依 backup/snapshot restore procedure 還原",
        backupRestoreDocument: BACKUP_RESTORE_DOCUMENT,
        backupAvailable: backup.valid
    };
}

async function verifyTemporalCutover(options = {}) {
    const statusProviders = options.statusProviders || {};
    const context = {
        dryRun: options.dryRun !== false,
        readOnly: true
    };
    const migrationStatus = await resolveProvider(
        options.migrationStatusProvider ||
            (typeof statusProviders.migration === "function"
                ? statusProviders.migration
                : undefined),
        options.migrationResult ??
            options.migrationStatus ??
            (typeof statusProviders.migration === "function"
                ? undefined
                : statusProviders.migration) ??
            statusProviders.migrationResult,
        context,
        "migration"
    );
    const preflightStatus = await resolveProvider(
        options.preflightStatusProvider ||
            (typeof statusProviders.preflight === "function"
                ? statusProviders.preflight
                : undefined),
        options.preflightResult ??
            options.preflightReport ??
            options.preflightStatus ??
            (typeof statusProviders.preflight === "function"
                ? undefined
                : statusProviders.preflight) ??
            statusProviders.preflightResult,
        context,
        "preflight"
    );
    const backupCandidate = await resolveProvider(
        options.backupStatusProvider ||
            (typeof statusProviders.backup === "function"
                ? statusProviders.backup
                : undefined),
        options.backupResult ??
            options.backupSnapshot ??
            options.backupStatus ??
            (typeof statusProviders.backup === "function"
                ? undefined
                : statusProviders.backup) ??
            statusProviders.backupResult,
        context,
        "backup"
    );
    const migration = validateMigrationCompletion(migrationStatus);
    const preflight = validatePreflightCompletion(preflightStatus);
    let backup;

    if (typeof options.backupVerifier === "function") {
        backup = normalizeVerificationResult(
            await options.backupVerifier(
                buildProviderInput(backupCandidate, context, "backup")
            ),
            "temporal-backup-verification-invalid",
            "The injected backup verifier did not return a valid result"
        );
    } else {
        backup = validateBackupRestoreability(backupCandidate);
    }

    const index = await verifyIndexGate({
        manifest: options.indexManifest || options.manifest,
        plans: options.plans || [],
        requirePlans:
            options.requirePlanValidation === true || options.plans !== undefined,
        indexVerification:
            options.indexVerificationResult || options.indexVerification,
        indexVerifier: options.indexVerifier,
        context
    });
    const diagnostics = [
        ...migration.diagnostics,
        ...preflight.diagnostics,
        ...backup.diagnostics,
        ...index.diagnostics
    ];
    const valid = diagnostics.length === 0;

    return {
        kind: GATE_KIND,
        version: GATE_VERSION,
        valid,
        readOnly: true,
        dryRun: context.dryRun,
        activationAllowed: valid,
        gates: {
            migration,
            preflight,
            backup,
            index
        },
        diagnostics,
        summary: {
            migrationComplete: migration.valid,
            preflightValid: preflight.valid,
            unresolvedInvalidDiagnostics: preflight.unresolvedDiagnostics.filter(
                (entry) => entry.category === TEMPORAL_CATEGORIES.INVALID
            ).length,
            unresolvedAmbiguousDiagnostics: preflight.unresolvedDiagnostics.filter(
                (entry) =>
                    entry.category === TEMPORAL_CATEGORIES.AMBIGUOUS_BSON_DATE
            ).length,
            backupRestorable: backup.valid,
            indexCompatible: index.compatibility.valid,
            explainValid: index.explain.valid,
            diagnosticCount: diagnostics.length
        },
        rollback: buildRollbackRecommendation(valid, backup)
    };
}

function createTemporalCutoverGate(options = {}) {
    return (context = {}) =>
        verifyTemporalCutover({
            ...options,
            ...context
        });
}

module.exports = {
    BACKUP_RESTORE_DOCUMENT,
    GATE_KIND,
    GATE_VERSION,
    createTemporalCutoverGate,
    validateBackupRestoreability,
    validateMigrationCompletion,
    validatePreflightCompletion,
    verifyTemporalCutover,
    runTemporalCutoverGate: verifyTemporalCutover
};
