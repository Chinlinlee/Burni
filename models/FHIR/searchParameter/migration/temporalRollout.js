const {
    runTemporalMigrationPreflight
} = require("./temporalPreflight");
const {
    validateTemporalIndexCompatibility,
    verifyTemporalExecutionModes
} = require("../indexes/indexCompatibility");
const { validateTemporalIndexManifest } = require("../indexes/indexValidation");
const {
    validateBackupRestoreability,
    verifyTemporalCutover
} = require("./temporalCutoverGate");

const ROLLOUT_KIND = "fhir-temporal-rollout-plan";
const ROLLOUT_VERSION = 1;
const BACKUP_RESTORE_DOCUMENT = "docs/temporal-migration-backup-restore.md";
const SCHEMA_CUTOVER_CONTRACT = Object.freeze({
    schemaMode: "canonical-only",
    temporalWriteNormalization: "canonical-object",
    registryActivationPolicy:
        "models/FHIR/searchParameter/registry/activationPolicy.js#applyActivationOverlay",
    registryReloadLifecycle:
        "models/FHIR/searchParameter/runtime/registryLifecycle.js#reloadSearchParameterRegistry"
});

const STEP_IDS = Object.freeze([
    "migration-preflight",
    "backup-snapshot",
    "migration",
    "index-creation",
    "index-verification",
    "cutover-completion-gate",
    "schema-cutover",
    "legacy-fallback-removal"
]);

const STEP_DEFINITIONS = Object.freeze([
    {
        id: "migration-preflight",
        operation: "preflight",
        mode: "read-only",
        dependsOn: [],
        prerequisite: "No source is written before the preflight gate passes.",
        abortOn: "invalid or ambiguous temporal data, or unavailable source models.",
        rollbackPoint: "No database rollback is required."
    },
    {
        id: "backup-snapshot",
        operation: "backup",
        mode: "write",
        dependsOn: ["migration-preflight"],
        prerequisite: "The migration preflight must be valid.",
        abortOn: "The backup or snapshot cannot be verified.",
        rollbackPoint: "Stop before migration; no temporal data has changed."
    },
    {
        id: "migration",
        operation: "migration",
        mode: "write",
        dependsOn: ["backup-snapshot"],
        prerequisite: "A recoverable backup or snapshot must be available.",
        abortOn: "The migration operation throws, reports failure, or leaves failed batches.",
        rollbackPoint: "Restore the pre-migration backup before proceeding."
    },
    {
        id: "index-creation",
        operation: "indexCreation",
        mode: "write",
        dependsOn: ["migration"],
        prerequisite: "The migration operation must have completed successfully.",
        abortOn: "Any manifest index cannot be created.",
        rollbackPoint: "Stop index rollout and use the deployment index rollback procedure."
    },
    {
        id: "index-verification",
        operation: "indexVerification",
        mode: "read-only",
        dependsOn: ["index-creation"],
        prerequisite: "The created indexes must match the 7.1 manifest.",
        abortOn: "Manifest compatibility or 7.2 explain verification fails.",
        rollbackPoint: "Do not activate the canonical schema; retain the backup."
    },
    {
        id: "cutover-completion-gate",
        operation: "cutoverCompletionGate",
        mode: "read-only",
        dependsOn: ["index-verification"],
        prerequisite:
            "Migration, preflight, backup restoreability, manifest compatibility, and explain verification must all pass.",
        abortOn:
            "Any cutover completion gate is missing, invalid, or unresolved.",
        rollbackPoint:
            "Do not activate the canonical schema; retain the backup."
    },
    {
        id: "schema-cutover",
        operation: "schemaCutover",
        mode: "write",
        dependsOn: ["cutover-completion-gate"],
        prerequisite: "The cutover completion gate must pass.",
        abortOn: "Canonical schema or registry activation fails.",
        rollbackPoint: "Roll back the application release and restore data if required."
    },
    {
        id: "legacy-fallback-removal",
        operation: "legacyFallbackRemoval",
        mode: "write",
        dependsOn: ["schema-cutover"],
        prerequisite: "Schema cutover must be complete and healthy.",
        abortOn: "Legacy fallback removal cannot be deployed consistently.",
        rollbackPoint: "Restore the previous application release; do not resume mixed-type search."
    }
]);

const ROLLBACK_PLAN = Object.freeze({
    backupRestoreDocument: BACKUP_RESTORE_DOCUMENT,
    onAbort: [
        "停止目前 rollout 與新版本服務，不執行後續步驟。",
        "保留原始 backup/snapshot 與 migration、index、schema 的操作記錄。",
        "若 migration 已寫入資料，依 backup/restore 文件確認目標資料庫後還原。",
        "還原後重新執行 read-only preflight，再切回相容的舊版服務。"
    ],
    prohibited: [
        "不得跳過 preflight、backup/snapshot、migration 或 index verification。",
        "不得在 schema cutover 前移除 legacy fallback。",
        "不得以 raw temporal value query 取代 canonical index gate。"
    ]
});

function getOperation(operations, name) {
    const aliases = {
        preflight: ["preflight"],
        backup: ["backup", "backupSnapshot"],
        migration: ["migration", "runMigration"],
        indexCreation: ["indexCreation", "createIndexes"],
        indexVerification: ["indexVerification", "verifyIndexes"],
        cutoverCompletionGate: ["cutoverCompletionGate", "verifyCutover"],
        schemaCutover: ["schemaCutover", "cutoverSchema"],
        legacyFallbackRemoval: ["legacyFallbackRemoval", "removeLegacyFallback"]
    };
    for (const alias of aliases[name] || []) {
        if (typeof operations?.[alias] === "function") {
            return operations[alias];
        }
    }
    return undefined;
}

function getExplainRequests(options) {
    return Array.isArray(options.indexVerification?.requests)
        ? options.indexVerification.requests
        : [];
}

function getExplainResult(options) {
    const result = options.indexVerification?.result;
    return result && typeof result === "object" ? result : undefined;
}

function getStepResult(stepResults, id) {
    return stepResults.find((step) => step.id === id)?.result;
}

function hasCutoverGateConfiguration(options) {
    return Boolean(
        options.cutoverGate ||
            options.cutoverGateOptions ||
            options.statusProviders ||
            options.migrationStatusProvider ||
            options.preflightStatusProvider ||
            options.backupStatusProvider ||
            options.backupVerifier ||
            options.indexVerifier ||
            typeof options.operations?.cutoverCompletionGate === "function" ||
            typeof options.operations?.verifyCutover === "function"
    );
}

function resolveActivationOperation(options, operation) {
    const adapter = options.activationAdapter;
    if (typeof adapter === "function") {
        return adapter;
    }
    if (adapter && typeof adapter.activate === "function") {
        return (context) => adapter.activate(context);
    }
    if (adapter && typeof adapter.cutover === "function") {
        return (context) => adapter.cutover(context);
    }
    return operation;
}

async function verifyBackupOperationResult(result, options, context) {
    if (typeof options.backupVerifier !== "function") {
        return validateBackupRestoreability(result);
    }
    return normalizeGateResult(
        await options.backupVerifier({
            ...(result && typeof result === "object" ? result : {}),
            ...context,
            backup: result,
            readOnly: true
        }),
        "temporal-backup-verification-invalid"
    );
}

function normalizeGateResult(result, fallbackCode) {
    if (result && typeof result === "object") {
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
        diagnostics: [
            {
                code: fallbackCode,
                message: "The injected rollout gate did not return a valid gate result"
            }
        ]
    };
}

function validatePreflightReport(report) {
    const summary = report?.summary || {};
    const invalid = summary.invalid || 0;
    const ambiguousBsonDates = summary.ambiguousBsonDates || 0;
    const diagnostics = [
        ...(Array.isArray(report?.diagnostics) ? report.diagnostics : []),
        ...(Array.isArray(report?.unresolvedDiagnostics)
            ? report.unresolvedDiagnostics
            : [])
    ];
    const unresolvedDiagnostics = diagnostics.filter(
        (diagnostic) =>
            diagnostic?.category === "invalid" ||
            diagnostic?.category === "ambiguous-bson-date" ||
            diagnostic?.category === "unavailable-source" ||
            diagnostic?.unresolved === true ||
            /(?:invalid|ambiguous|unavailable)/i.test(String(diagnostic?.code || ""))
    );
    const unavailableSources = Math.max(
        Number(summary.unavailableSources || 0),
        Array.isArray(report?.sources)
            ? report.sources.filter((source) => source?.available === false).length
            : 0,
        Array.isArray(report?.diagnostics)
            ? report.diagnostics.filter(
                  (diagnostic) =>
                      diagnostic?.category === "unavailable-source" ||
                      diagnostic?.code === "temporal-preflight-source-unavailable"
              ).length
            : 0
    );
    const valid =
        report?.valid === true &&
        invalid === 0 &&
        ambiguousBsonDates === 0 &&
        unavailableSources === 0 &&
        unresolvedDiagnostics.length === 0;
    const gateDiagnostics = [];
    if (!valid) {
        gateDiagnostics.push({
            code: "temporal-preflight-gate-failed",
            message:
                "Temporal migration preflight must be valid with no invalid, ambiguous, or unavailable source data",
            summary,
            diagnostics: unresolvedDiagnostics
        });
    }
    return { valid, diagnostics: gateDiagnostics, report };
}

function operationSucceeded(result, operationName) {
    if (result && typeof result === "object") {
        if (result.ok === false || result.failed === true || result.valid === false) {
            return false;
        }
        if (operationName === "migration" && result.summary?.failed > 0) {
            return false;
        }
    }
    return true;
}

function createTemporalRolloutPlan(options = {}) {
    const manifest = options.indexManifest || options.manifest;
    if (!manifest) {
        throw new TypeError("Temporal rollout requires the 7.1 temporal index manifest");
    }

    const plans = Array.isArray(options.plans) ? options.plans : [];
    const requirePlans =
        options.requirePlanValidation === true || options.plans !== undefined;
    const manifestGate = validateTemporalIndexManifest(manifest, {
        plans,
        requirePlans
    });
    const compatibilityGate = validateTemporalIndexCompatibility(manifest, {
        plans,
        requirePlans
    });
    const explainResult = getExplainResult(options);
    const explainRequests = getExplainRequests(options);
    const explainConfigured = Boolean(explainResult) || explainRequests.length > 0;
    const explainGate = explainResult
        ? normalizeGateResult(explainResult, "temporal-explain-gate-invalid")
        : {
              valid: explainConfigured,
              status: explainConfigured ? "pending" : "missing",
              requestCount: explainRequests.length,
              diagnostics: explainConfigured
                  ? []
                  : [
                        {
                            code: "temporal-explain-gate-required",
                            message:
                                "Index verification requires 7.2 explain requests or an injected explain result"
                        }
                    ]
          };

    return {
        kind: ROLLOUT_KIND,
        version: ROLLOUT_VERSION,
        dryRun: options.dryRun !== false,
        nonTemporalRollout: "unchanged",
        steps: STEP_DEFINITIONS.map((step) => ({ ...step })),
        gates: {
            indexManifest: {
                valid: manifestGate.valid,
                errors: manifestGate.errors
            },
            indexCompatibility: compatibilityGate,
            explain: explainGate
        },
        indexManifest: manifest,
        plans,
        schemaCutover: SCHEMA_CUTOVER_CONTRACT,
        rollback: ROLLBACK_PLAN,
        valid:
            manifestGate.valid &&
            compatibilityGate.valid &&
            explainGate.valid
    };
}

async function runIndexVerification({
    plan,
    options,
    operation,
    context
}) {
    if (operation) {
        return normalizeGateResult(
            await operation({
                ...context,
                manifest: plan.indexManifest,
                plans: plan.plans,
                explainRequests: getExplainRequests(options),
                explainAdapter: options.explainAdapter,
                dryRun: options.dryRun !== false
            }),
            "temporal-index-verification-invalid"
        );
    }

    const configuredResult = getExplainResult(options);
    if (configuredResult) {
        return normalizeGateResult(configuredResult, "temporal-explain-gate-invalid");
    }

    const requests = getExplainRequests(options);
    if (requests.length === 0) {
        return {
            valid: false,
            diagnostics: [
                {
                    code: "temporal-explain-gate-required",
                    message:
                        "Index verification requires at least one 7.2 explain request"
                }
            ]
        };
    }

    const results = [];
    for (const request of requests) {
        results.push(
            await verifyTemporalExecutionModes({
                ...request,
                manifest: plan.indexManifest,
                explainAdapter: options.explainAdapter,
                dryRun: options.dryRun !== false
            })
        );
    }
    return {
        valid: results.every((result) => result.valid),
        diagnostics: results.flatMap((result) => result.diagnostics || []),
        results
    };
}

function buildPreflightOperation(options, operations) {
    const injected = getOperation(operations, "preflight");
    if (injected) {
        return injected;
    }
    if (!options.models) {
        return undefined;
    }
    return (context) =>
        runTemporalMigrationPreflight({
            models: options.models,
            ...(options.catalog === undefined ? {} : { catalog: options.catalog }),
            ...(options.definitions === undefined ? {} : { definitions: options.definitions }),
            includeHistory: options.includeHistory !== false,
            ...context
        });
}

async function runTemporalRollout(options = {}) {
    const plan = options.plan || createTemporalRolloutPlan(options);
    const dryRun = options.dryRun !== false;
    const operations = options.operations || {};
    const preflightOperation = buildPreflightOperation(options, operations);
    const operationMap = {
        ...operations,
        preflight: preflightOperation
    };
    const stepResults = [];
    const completed = new Set();
    let failure;

    if (!plan.valid) {
        return {
            status: "aborted",
            dryRun,
            plan,
            steps: stepResults,
            rollback: plan.rollback,
            failure: {
                stepId: "plan-validation",
                diagnostics: [
                    ...(plan.gates.indexManifest.errors || []).map((message) => ({
                        code: "index-manifest-invalid",
                        message
                    })),
                    ...(plan.gates.indexCompatibility.diagnostics || []),
                    ...(plan.gates.explain.diagnostics || [])
                ]
            }
        };
    }

    for (const step of plan.steps) {
        const dependenciesReady = step.dependsOn.every((dependency) =>
            completed.has(dependency)
        );
        if (!dependenciesReady) {
            failure = {
                stepId: step.id,
                diagnostics: [
                    {
                        code: "rollout-dependency-not-complete",
                        message: `Rollout dependency is not complete for ${step.id}`,
                        dependsOn: step.dependsOn
                    }
                ]
            };
            break;
        }

        const operation =
            step.id === "schema-cutover"
                ? resolveActivationOperation(
                      options,
                      getOperation(operationMap, step.operation)
                  )
                : getOperation(operationMap, step.operation);
        const context = {
            plan,
            step,
            dryRun,
            previousSteps: stepResults,
            manifest: plan.indexManifest,
            plans: plan.plans,
            schemaCutover: plan.schemaCutover,
            backupRestoreDocument: BACKUP_RESTORE_DOCUMENT
        };

        if (step.id === "migration-preflight") {
            if (!operation) {
                if (!dryRun) {
                    failure = {
                        stepId: step.id,
                        diagnostics: [
                            {
                                code: "rollout-operation-required",
                                message: "An injected operation is required for preflight"
                            }
                        ]
                    };
                    break;
                }
                stepResults.push({ id: step.id, status: "planned" });
                completed.add(step.id);
                continue;
            }
            try {
                const result = validatePreflightReport(await operation(context));
                stepResults.push({ id: step.id, status: result.valid ? "validated" : "aborted", result });
                if (!result.valid) {
                    failure = { stepId: step.id, diagnostics: result.diagnostics };
                    break;
                }
                completed.add(step.id);
            } catch (error) {
                failure = {
                    stepId: step.id,
                    diagnostics: [
                        {
                            code: "temporal-preflight-operation-failed",
                            message: error instanceof Error ? error.message : String(error)
                        }
                    ]
                };
                break;
            }
            continue;
        }

        if (step.id === "index-verification") {
            try {
                const result = await runIndexVerification({
                    plan,
                    options: { ...options, dryRun },
                    operation,
                    context
                });
                stepResults.push({ id: step.id, status: result.valid ? "validated" : "aborted", result });
                if (!result.valid) {
                    failure = { stepId: step.id, diagnostics: result.diagnostics };
                    break;
                }
                completed.add(step.id);
            } catch (error) {
                failure = {
                    stepId: step.id,
                    diagnostics: [
                        {
                            code: "temporal-index-verification-failed",
                            message: error instanceof Error ? error.message : String(error)
                        }
                    ]
                };
                break;
            }
            continue;
        }

        if (step.id === "backup-snapshot" && !dryRun) {
            if (!operation) {
                failure = {
                    stepId: step.id,
                    diagnostics: [
                        {
                            code: "rollout-operation-required",
                            message: "An injected operation is required for backup"
                        }
                    ]
                };
                break;
            }
            try {
                const backupResult = await operation(context);
                const verification = await verifyBackupOperationResult(
                    backupResult,
                    options,
                    context
                );
                if (!verification.valid) {
                    failure = {
                        stepId: step.id,
                        diagnostics: verification.diagnostics || [],
                        rollback: plan.rollback
                    };
                    stepResults.push({
                        id: step.id,
                        status: "aborted",
                        result: verification
                    });
                    break;
                }
                stepResults.push({
                    id: step.id,
                    status: "completed",
                    result: {
                        ...(backupResult &&
                        typeof backupResult === "object"
                            ? backupResult
                            : {}),
                        restorable: true,
                        backupVerification: verification
                    }
                });
                completed.add(step.id);
            } catch (error) {
                failure = {
                    stepId: step.id,
                    diagnostics: [
                        {
                            code: "rollout-operation-threw",
                            message:
                                error instanceof Error
                                    ? error.message
                                    : String(error)
                        }
                    ]
                };
                stepResults.push({ id: step.id, status: "aborted" });
                break;
            }
            continue;
        }

        if (step.id === "cutover-completion-gate") {
            const injectedGate = getOperation(
                operationMap,
                "cutoverCompletionGate"
            );
            if (dryRun && !hasCutoverGateConfiguration(options) && !injectedGate) {
                stepResults.push({
                    id: step.id,
                    status: "planned",
                    operation: step.operation
                });
                completed.add(step.id);
                continue;
            }

            const injectedGateOperation =
                typeof options.cutoverGate === "function"
                    ? options.cutoverGate
                    : injectedGate;
            const gateOptions = {
                ...(options.cutoverGateOptions || {}),
                indexManifest: plan.indexManifest,
                plans: plan.plans,
                migrationResult: getStepResult(stepResults, "migration"),
                preflightResult: getStepResult(
                    stepResults,
                    "migration-preflight"
                ),
                backupResult: getStepResult(stepResults, "backup-snapshot"),
                indexVerificationResult: getStepResult(
                    stepResults,
                    "index-verification"
                ),
                indexVerification: options.indexVerification,
                statusProviders: options.statusProviders,
                migrationStatusProvider: options.migrationStatusProvider,
                preflightStatusProvider: options.preflightStatusProvider,
                backupStatusProvider: options.backupStatusProvider,
                backupVerifier: options.backupVerifier,
                indexVerifier: options.indexVerifier,
                dryRun
            };

            try {
                const baseResult = await verifyTemporalCutover(gateOptions);
                let result = baseResult;
                if (injectedGateOperation) {
                    const injectedResult = normalizeGateResult(
                        await injectedGateOperation({
                            ...gateOptions,
                            plan,
                            step,
                            previousSteps: stepResults,
                            activationAdapter: options.activationAdapter,
                            gate: baseResult
                        }),
                        "temporal-cutover-gate-invalid"
                    );
                    result = {
                        ...baseResult,
                        valid: baseResult.valid && injectedResult.valid,
                        diagnostics: [
                            ...baseResult.diagnostics,
                            ...injectedResult.diagnostics
                        ],
                        injectedGate: injectedResult
                    };
                }
                result = normalizeGateResult(
                    result,
                    "temporal-cutover-gate-invalid"
                );
                stepResults.push({
                    id: step.id,
                    status: result.valid ? "validated" : "aborted",
                    result
                });
                if (!result.valid) {
                    failure = {
                        stepId: step.id,
                        diagnostics: result.diagnostics || [],
                        rollback: result.rollback
                    };
                    break;
                }
                completed.add(step.id);
            } catch (error) {
                failure = {
                    stepId: step.id,
                    diagnostics: [
                        {
                            code: "temporal-cutover-gate-failed",
                            message:
                                error instanceof Error
                                    ? error.message
                                    : String(error)
                        }
                    ]
                };
                stepResults.push({ id: step.id, status: "aborted" });
                break;
            }
            continue;
        }

        if (dryRun) {
            stepResults.push({
                id: step.id,
                status: "planned",
                operation: step.operation
            });
            completed.add(step.id);
            continue;
        }

        if (!operation) {
            failure = {
                stepId: step.id,
                diagnostics: [
                    {
                        code: "rollout-operation-required",
                        message: `An injected operation is required for ${step.operation}`
                    }
                ]
            };
            break;
        }

        try {
            const result = await operation(context);
            if (!operationSucceeded(result, step.operation)) {
                failure = {
                    stepId: step.id,
                    diagnostics: [
                        {
                            code: "rollout-operation-failed",
                            message: `Rollout operation failed for ${step.operation}`,
                            result
                        }
                    ]
                };
                stepResults.push({ id: step.id, status: "aborted", result });
                break;
            }
            stepResults.push({ id: step.id, status: "completed", result });
            completed.add(step.id);
        } catch (error) {
            failure = {
                stepId: step.id,
                diagnostics: [
                    {
                        code: "rollout-operation-threw",
                        message: error instanceof Error ? error.message : String(error)
                    }
                ]
            };
            stepResults.push({ id: step.id, status: "aborted" });
            break;
        }
    }

    if (failure) {
        return {
            status: "aborted",
            dryRun,
            plan,
            steps: stepResults,
            rollback: plan.rollback,
            failure
        };
    }

    return {
        status: dryRun ? "planned" : "completed",
        dryRun,
        plan,
        steps: stepResults,
        rollback: plan.rollback
    };
}

module.exports = {
    BACKUP_RESTORE_DOCUMENT,
    ROLLBACK_PLAN,
    ROLLOUT_KIND,
    ROLLOUT_VERSION,
    SCHEMA_CUTOVER_CONTRACT,
    STEP_DEFINITIONS,
    STEP_IDS,
    createTemporalRolloutPlan,
    runTemporalRollout,
    runTemporalCutoverGate: verifyTemporalCutover,
    verifyTemporalCutover,
    validatePreflightReport
};
