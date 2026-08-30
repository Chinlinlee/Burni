require("module-alias/register");

const { expect } = require("chai");
const {
    runIsolatedConnectorScenario
} = require("../../support/mongodb/connector-lifecycle-fixture");

describe("MongoDB connector lifecycle", function () {
    this.timeout(180000);

    describe("3.1 synchronous model map before application readiness", function () {
        it("exposes the sync model map and readiness promises in an isolated process", function () {
            const result = runIsolatedConnectorScenario("syncMapBeforeReady");

            expect(result.ok).to.equal(true);
            expect(result.hasPatientModel).to.equal(true);
            expect(result.hasReadyPromise).to.equal(true);
            expect(result.readyNotInModelKeys).to.equal(true);
            expect(result.shardingReadyNotInModelKeys).to.equal(true);
            expect(result.readySettledBeforeAwait).to.equal(true);
            expect(result.modelCount).to.be.greaterThan(0);
        });
    });

    describe("3.2 deterministic model registration", function () {
        it("discovers sorted model groups and registers resource, history, then static models", function () {
            const result = runIsolatedConnectorScenario("registrationOrderAndDiscovery");

            expect(result.ok).to.equal(true);
            expect(result.resourceModelsSorted).to.equal(true);
            expect(result.historyModelsSorted).to.equal(true);
            expect(result.staticModelsSorted).to.equal(true);
            expect(result.hasResourceModels).to.equal(true);
            expect(result.hasHistoryModels).to.equal(true);
            expect(result.hasStaticModels).to.equal(true);
            expect(result.registrationOrderUsesResourceBeforeHistory).to.equal(true);
            expect(result.registrationOrderUsesHistoryBeforeStatic).to.equal(true);
            expect(result.registerDiscoveredModelsSourceMatches).to.equal(true);
            expect(result.trackedRegistrationCount).to.be.greaterThan(0);
        });

        it("throws immediately when a model name collision is detected", function () {
            const result = runIsolatedConnectorScenario("modelCollisionImmediateError");

            expect(result.ok).to.equal(true);
            expect(result.error?.name).to.equal("MongoDBModelCollisionError");
            expect(result.modelMapSize).to.equal(1);
        });
    });

    describe("3.3 singleton initialization", function () {
        it("reuses the same model map and readiness promises for identical config", function () {
            const result = runIsolatedConnectorScenario("idempotentSameConfig");

            expect(result.ok).to.equal(true);
            expect(result.sameMapReference).to.equal(true);
            expect(result.sharedReadyPromise).to.equal(true);
            expect(result.sharedShardingReadyPromise).to.equal(true);
        });

        it("rejects a conflicting configuration without replacing the existing initialization", function () {
            const result = runIsolatedConnectorScenario("rejectConflictingConfig");

            expect(result.ok).to.equal(true);
            expect(result.error?.name).to.equal("MongoDBInitializationConflictError");
        });

        it("preserves a failed initialization result instead of retrying automatically", function () {
            const result = runIsolatedConnectorScenario("failedInitDoesNotRetry");

            expect(result.ok).to.equal(true);
            expect(result.readyError).to.not.equal(null);
            expect(result.secondInitError).to.not.equal(null);
            expect(result.secondInitMatchesReadyFailure).to.equal(true);
        });
    });

    describe("3.4 database, registry, and sharding readiness", function () {
        it("resolves application readiness after database and SearchParameter registry success", function () {
            const result = runIsolatedConnectorScenario("databaseAndRegistrySuccess");

            expect(result.ok).to.equal(true);
            expect(result.registryReady).to.equal(true);
            expect(result.shardingReady).to.equal(true);
        });

        it("rejects application readiness when database connection fails", function () {
            const result = runIsolatedConnectorScenario("databaseFailureBlocksReady");

            expect(result.ok).to.equal(true);
            expect(result.readyError).to.not.equal(null);
            expect(result.shardingReadyResolvedWhenDisabled).to.equal(true);
        });

        it("rejects application readiness when SearchParameter registry reload fails", function () {
            const result = runIsolatedConnectorScenario("registryFailureBlocksReady");

            expect(result.ok).to.equal(true);
            expect(result.readyError?.message).to.include(
                "simulated SearchParameter registry failure"
            );
            expect(result.databaseConnected).to.equal(true);
        });

        it("keeps sharding provisioning independent from application readiness success", function () {
            const result = runIsolatedConnectorScenario(
                "shardingIndependentFromApplicationReady"
            );

            expect(result.ok).to.equal(true);
            expect(result.readyResolved).to.equal(true);
            expect(result.shardingReadyResolved).to.equal(true);
        });

        it("reports sharding failures without rejecting application readiness", function () {
            const result = runIsolatedConnectorScenario("shardingFailureDoesNotRejectReady");

            expect(result.ok).to.equal(true);
            expect(result.readyResolved).to.equal(true);
            expect(result.shardingError?.message).to.include("simulated sharding failure");
        });
    });

    describe("3.5 safe initialization logs", function () {
        it("records phase timings without leaking credentials", function () {
            const result = runIsolatedConnectorScenario("safeInitLogs");

            expect(result.ok).to.equal(true);
            expect(result.modelRegistryLogRecorded).to.equal(true);
            expect(result.databaseLogRecorded).to.equal(true);
            expect(result.searchParameterLogRecorded).to.equal(true);
            expect(result.totalInitLogRecorded).to.equal(true);
            expect(result.noPasswordInLogs).to.equal(true);
            expect(result.noAuthenticatedUrlInLogs).to.equal(true);
        });
    });

    describe("3.6 pre-existing database connection", function () {
        it("reuses an existing matching default mongoose connection", function () {
            const result = runIsolatedConnectorScenario("preExistingConnection");

            expect(result.ok).to.equal(true);
            expect(result.connectionReadyState).to.equal(1);
            expect(result.connectCalledAgain).to.equal(false);
        });
    });
});
