"use strict";

const mongoose = require("mongoose");
const {
    INDEX_RECONCILE_STATUS,
    PROVISIONING_RUN_STATUS
} = require("./contracts");
const {
    ensureControlPlaneOnConnection,
    registerControlPlaneModels
} = require("./controlPlaneModels");
const {
    discoverModelFiles,
    registerDiscoveredModels,
    normalizeConfig,
    buildMongooseConnectOptions,
    disableAutomaticSchemaProvisioning
} = require("../connector");
const { verifyMongoProvisioning } = require("./provisioningService");
const { runLockedMongoProvisioning, resolveDatabaseIdentity } = require("./provisioningRun");
const {
    createProvisioningStateStore,
    getLatestProvisioningState
} = require("./provisioningState");
const { auditDuplicateResourceIds } = require("./identityAuditAdapter");

const EXIT_SUCCESS = 0;
const EXIT_PROVISION_FAILED = 1;
const EXIT_VERIFY_FAILED = 2;
const EXIT_AUDIT_FAILED = 3;
const EXIT_AUDIT_NOT_AVAILABLE = 4;
const EXIT_CONNECTION_FAILED = 5;
const EXIT_USAGE = 64;

/**
 * @param {import('./types').IndexReconcileEntry[]} indexes
 * @returns {{ missing: import('./types').IndexReconcileEntry[], extra: import('./types').IndexReconcileEntry[], mismatch: import('./types').IndexReconcileEntry[] }}
 */
function groupIndexDrift(indexes) {
    return {
        missing: indexes.filter((entry) => entry.status === INDEX_RECONCILE_STATUS.MISSING),
        extra: indexes.filter((entry) => entry.status === INDEX_RECONCILE_STATUS.EXTRA),
        mismatch: indexes.filter((entry) => entry.status === INDEX_RECONCILE_STATUS.MISMATCH)
    };
}

/**
 * @param {import('./types').DesiredManifest} manifest
 * @param {import('./provisioningState').ProvisioningStateStore} stateStore
 * @param {string} databaseIdentity
 * @returns {Promise<{ drifted: boolean, persisted?: { manifestChecksum: string, manifestVersion: number }, current: { manifestChecksum: string, manifestVersion: number }, reason?: string }>}
 */
async function evaluateManifestIdentityDrift(manifest, stateStore, databaseIdentity) {
    const current = {
        manifestChecksum: manifest.checksum.value,
        manifestVersion: manifest.version
    };
    const persisted = await getLatestProvisioningState(stateStore, databaseIdentity);
    if (!persisted) {
        return {
            drifted: false,
            current,
            reason: "no-persisted-state"
        };
    }

    const drifted =
        persisted.manifestChecksum !== current.manifestChecksum ||
        persisted.manifestVersion !== current.manifestVersion;

    return {
        drifted,
        persisted: {
            manifestChecksum: persisted.manifestChecksum,
            manifestVersion: persisted.manifestVersion
        },
        current
    };
}

/**
 * @param {Object} input
 * @returns {Object}
 */
function buildVerifyReport(input) {
    const drift = groupIndexDrift(input.reconcile.indexes);
    return {
        kind: "mongodb-verify-report",
        generatedAt: new Date().toISOString(),
        verified: input.reconcile.verified && !input.manifestIdentityDrift.drifted,
        manifest: {
            version: input.reconcile.manifestVersion,
            checksum: input.reconcile.manifestChecksum
        },
        summary: input.reconcile.summary,
        collections: input.reconcile.collections,
        indexes: {
            missing: drift.missing,
            extra: drift.extra,
            mismatch: drift.mismatch
        },
        manifestIdentityDrift: input.manifestIdentityDrift,
        errors: input.reconcile.errors
    };
}

/**
 * @param {Object} config
 * @param {Object} [options]
 * @returns {Promise<{ modelMap: Record<string, import("mongoose").Model>, connection: import("mongoose").Connection, lockModel: import("mongoose").Model, stateModel: import("mongoose").Model }>}
 */
async function connectOperationalMongo(config, options = {}) {
    disableAutomaticSchemaProvisioning();
    const normalized = normalizeConfig(config);
    const connectOptions = buildMongooseConnectOptions(config);

    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }

    await mongoose.connect(normalized.connectionUrl, connectOptions);
    const connection = mongoose.connection;

    const modelMap = {};
    const discovered = options.discovered ?? discoverModelFiles();
    registerDiscoveredModels(discovered, modelMap, connection);
    const controlPlane =
        options.ensureControlPlane === false
            ? registerControlPlaneModels(connection)
            : await ensureControlPlaneOnConnection(connection);

    return {
        modelMap,
        connection,
        ...controlPlane
    };
}

/**
 * @param {Object} [options]
 * @param {NodeJS.ProcessEnv} [options.config]
 * @returns {Promise<{ exitCode: number, report: Object }>}
 */
async function runMongoProvisionCommand(options = {}) {
    const config = options.config || process.env;
    let context;

    try {
        context = await connectOperationalMongo(config, options);
    } catch (error) {
        return {
            exitCode: EXIT_CONNECTION_FAILED,
            report: {
                kind: "mongodb-provision-report",
                generatedAt: new Date().toISOString(),
                status: "connection-failed",
                error: serializeCaughtError(error)
            }
        };
    }

    try {
        const result = await runLockedMongoProvisioning({
            connection: context.connection,
            modelMap: context.modelMap,
            lockModel: context.lockModel,
            stateModel: context.stateModel,
            ...options.provisioningOptions
        });

        const exitCode =
            result.status === PROVISIONING_RUN_STATUS.SUCCEEDED
                ? EXIT_SUCCESS
                : EXIT_PROVISION_FAILED;

        return {
            exitCode,
            report: {
                kind: "mongodb-provision-report",
                generatedAt: new Date().toISOString(),
                status: result.status,
                runId: result.runId,
                databaseIdentity: result.databaseIdentity,
                manifest: {
                    version: result.manifestVersion,
                    checksum: result.manifestChecksum
                },
                phaseResults: result.phaseResults,
                driftSummary: result.driftSummary,
                errors: result.errors,
                reconcileResult: result.reconcileResult
            }
        };
    } catch (error) {
        return {
            exitCode: EXIT_PROVISION_FAILED,
            report: {
                kind: "mongodb-provision-report",
                generatedAt: new Date().toISOString(),
                status: "failed",
                error: serializeCaughtError(error)
            }
        };
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }
}

/**
 * @param {Object} [options]
 * @param {NodeJS.ProcessEnv} [options.config]
 * @returns {Promise<{ exitCode: number, report: Object }>}
 */
async function runMongoVerifyCommand(options = {}) {
    const config = options.config || process.env;
    let context;

    try {
        context = await connectOperationalMongo(config, {
            ...options,
            ensureControlPlane: false
        });
    } catch (error) {
        return {
            exitCode: EXIT_CONNECTION_FAILED,
            report: {
                kind: "mongodb-verify-report",
                generatedAt: new Date().toISOString(),
                verified: false,
                error: serializeCaughtError(error)
            }
        };
    }

    try {
        const reconcile = await verifyMongoProvisioning({
            connection: context.connection,
            modelMap: context.modelMap,
            ddlClient: options.ddlClient,
            ...options.verifyOptions
        });
        const databaseIdentity = resolveDatabaseIdentity(context.connection.db);
        const stateStore = createProvisioningStateStore(context.stateModel);
        const manifestIdentityDrift = await evaluateManifestIdentityDrift(
            { checksum: { value: reconcile.manifestChecksum }, version: reconcile.manifestVersion },
            stateStore,
            databaseIdentity
        );
        const report = buildVerifyReport({
            reconcile,
            manifestIdentityDrift
        });
        const exitCode = report.verified ? EXIT_SUCCESS : EXIT_VERIFY_FAILED;

        return { exitCode, report };
    } catch (error) {
        return {
            exitCode: EXIT_VERIFY_FAILED,
            report: {
                kind: "mongodb-verify-report",
                generatedAt: new Date().toISOString(),
                verified: false,
                error: serializeCaughtError(error)
            }
        };
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }
}

/**
 * @param {Object} [options]
 * @param {NodeJS.ProcessEnv} [options.config]
 * @returns {Promise<{ exitCode: number, report: Object }>}
 */
async function runMongoAuditIdCommand(options = {}) {
    const config = options.config || process.env;
    const connect = options.connectOperationalMongo || connectOperationalMongo;
    let context;

    try {
        context = await connect(config, {
            ...options,
            ensureControlPlane: false
        });
    } catch (error) {
        return {
            exitCode: EXIT_CONNECTION_FAILED,
            report: {
                kind: "mongodb-audit-id-report",
                generatedAt: new Date().toISOString(),
                available: true,
                error: serializeCaughtError(error)
            }
        };
    }

    try {
        const auditReport = await auditDuplicateResourceIds({
            connection: context.connection,
            modelMap: context.modelMap,
            catalog: options.catalog,
            auditClient: options.auditClient,
            catalogOptions: options.catalogOptions,
            ...options.auditOptions
        });
        const hasDuplicates = auditReport.hasDuplicates;

        return {
            exitCode: hasDuplicates ? EXIT_AUDIT_FAILED : EXIT_SUCCESS,
            report: {
                kind: "mongodb-audit-id-report",
                generatedAt: new Date().toISOString(),
                available: true,
                ...auditReport
            }
        };
    } catch (error) {
        return {
            exitCode: EXIT_AUDIT_FAILED,
            report: {
                kind: "mongodb-audit-id-report",
                generatedAt: new Date().toISOString(),
                available: true,
                error: serializeCaughtError(error)
            }
        };
    } finally {
        if (!options.keepConnectionOpen && mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }
}

/**
 * @param {unknown} error
 * @returns {{ name: string, message: string }}
 */
function serializeCaughtError(error) {
    if (error instanceof Error) {
        return {
            name: error.name,
            message: error.message
        };
    }
    return {
        name: "Error",
        message: String(error)
    };
}

module.exports = {
    EXIT_SUCCESS,
    EXIT_PROVISION_FAILED,
    EXIT_VERIFY_FAILED,
    EXIT_AUDIT_FAILED,
    EXIT_AUDIT_NOT_AVAILABLE,
    EXIT_CONNECTION_FAILED,
    EXIT_USAGE,
    connectOperationalMongo,
    evaluateManifestIdentityDrift,
    buildVerifyReport,
    groupIndexDrift,
    runMongoProvisionCommand,
    runMongoVerifyCommand,
    runMongoAuditIdCommand,
    serializeCaughtError
};
