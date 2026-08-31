require("module-alias/register");

const { expect } = require("chai");
const { createSearchQueryPlan } = require("@models/FHIR/searchParameter/compiler/searchQueryPlan");
const { generateTemporalIndexManifest } = require("@models/FHIR/searchParameter/indexes/indexGenerator");
const {
    createTemporalRolloutPlan,
    runTemporalRollout
} = require("@models/FHIR/searchParameter/migration/temporalRollout");

function buildPlan() {
    return createSearchQueryPlan({
        canonicalKey: "http://example.org/SearchParameter/observation-effective::4.0.1",
        resourceType: "Observation",
        code: "effective",
        searchType: "date",
        extractionPaths: [{ path: "effectiveDateTime", datatype: "dateTime" }],
        comparators: ["eq", "ne", "lt", "gt", "ge", "le", "sa", "eb", "ap"]
    });
}

function buildManifest(plan = buildPlan()) {
    return generateTemporalIndexManifest([
        {
            canonicalKey: plan.canonicalKey,
            effectiveStatus: "active",
            resource: { code: plan.code },
            lookupPlans: {
                [`${plan.resourceType}::${plan.code}`]: {
                    compilable: true,
                    plan
                }
            }
        }
    ]);
}

function explainRequests(plan = buildPlan()) {
    return [
        {
            plan,
            rawValue: "2020",
            parameterName: "effective"
        }
    ];
}

describe("temporal rollout orchestration", function () {
    it("defines a strict sequence and keeps non-temporal rollout unchanged", function () {
        const plan = createTemporalRolloutPlan({
            indexManifest: buildManifest(),
            plans: [buildPlan()],
            indexVerification: { requests: explainRequests() }
        });

        expect(plan.valid).to.equal(true);
        expect(plan.steps.map((step) => step.id)).to.deep.equal([
            "migration-preflight",
            "backup-snapshot",
            "migration",
            "index-creation",
            "index-verification",
            "cutover-completion-gate",
            "schema-cutover",
            "legacy-fallback-removal"
        ]);
        expect(plan.steps.map((step) => step.dependsOn)).to.deep.equal([
            [],
            ["migration-preflight"],
            ["backup-snapshot"],
            ["migration"],
            ["index-creation"],
            ["index-verification"],
            ["cutover-completion-gate"],
            ["schema-cutover"]
        ]);
        expect(plan.nonTemporalRollout).to.equal("unchanged");
        expect(plan.schemaCutover.registryActivationPolicy).to.include(
            "applyActivationOverlay"
        );
        expect(plan.schemaCutover.registryReloadLifecycle).to.include(
            "reloadSearchParameterRegistry"
        );
        expect(plan.rollback.backupRestoreDocument).to.equal(
            "docs/temporal-migration-backup-restore.md"
        );
    });

    it("requires the manifest and explain gate before execution", function () {
        const plan = createTemporalRolloutPlan({
            indexManifest: buildManifest(),
            plans: [buildPlan()]
        });

        expect(plan.valid).to.equal(false);
        expect(plan.gates.explain.diagnostics[0].code).to.equal(
            "temporal-explain-gate-required"
        );
        expect(
            createTemporalRolloutPlan({
                indexManifest: { kind: "invalid" },
                indexVerification: { requests: explainRequests() }
            }).valid
        ).to.equal(false);
    });

    it("rejects rollout plan validation with empty compiled plans", function () {
        const result = createTemporalRolloutPlan({
            indexManifest: buildManifest(),
            plans: [],
            indexVerification: { requests: explainRequests() }
        });

        expect(result.valid).to.equal(false);
        expect(result.gates.indexManifest.errors).to.include(
            "Temporal index manifest plan validation requires compiled plans"
        );
    });

    it("does not invoke write operations in the default dry-run", async function () {
        const calls = [];
        const result = await runTemporalRollout({
            indexManifest: buildManifest(),
            plans: [buildPlan()],
            indexVerification: { requests: explainRequests() },
            operations: {
                preflight: async () => {
                    calls.push("preflight");
                    return {
                        valid: true,
                        summary: { invalid: 0, ambiguousBsonDates: 0 }
                    };
                },
                backup: async () => calls.push("backup"),
                migration: async () => calls.push("migration"),
                createIndexes: async () => calls.push("index-creation"),
                schemaCutover: async () => calls.push("schema-cutover"),
                removeLegacyFallback: async () => calls.push("legacy-fallback-removal")
            }
        });

        expect(result.status).to.equal("planned");
        expect(calls).to.deep.equal(["preflight"]);
        expect(result.steps.map((step) => step.id)).to.have.length(8);
        expect(
            result.steps
                .filter((step) => step.id !== "migration-preflight" && step.id !== "index-verification")
                .every((step) => step.status === "planned")
        ).to.equal(true);
    });

    it("does not execute writes without an injected preflight", async function () {
        const calls = [];
        const result = await runTemporalRollout({
            dryRun: false,
            indexManifest: buildManifest(),
            plans: [buildPlan()],
            indexVerification: { requests: explainRequests() },
            operations: {
                backup: async () => calls.push("backup"),
                migration: async () => calls.push("migration")
            }
        });

        expect(result.status).to.equal("aborted");
        expect(result.failure.stepId).to.equal("migration-preflight");
        expect(calls).to.deep.equal([]);
    });

    it("fails the initial gate on tampered preflight diagnostics", async function () {
        for (const diagnostic of [
            { category: "invalid", unresolved: true },
            { category: "ambiguous-bson-date", unresolved: true },
            { category: "unavailable-source", unresolved: true },
            { valid: false }
        ]) {
            const calls = [];
            const result = await runTemporalRollout({
                dryRun: false,
                indexManifest: buildManifest(),
                plans: [buildPlan()],
                indexVerification: { requests: explainRequests() },
                operations: {
                    preflight: async () => ({
                        valid: true,
                        summary: { invalid: 0, ambiguousBsonDates: 0, unavailableSources: 0 },
                        ...(diagnostic.valid === false ? diagnostic : { diagnostics: [diagnostic] })
                    }),
                    backup: async () => calls.push("backup")
                }
            });

            expect(result.status).to.equal("aborted");
            expect(result.failure.stepId).to.equal("migration-preflight");
            expect(calls).to.deep.equal([]);
        }
    });

    it("removes legacy fallback only after a successful schema cutover", async function () {
        const calls = [];
        const operations = {
            preflight: async () => ({
                valid: true,
                summary: { invalid: 0, ambiguousBsonDates: 0 }
            }),
            backup: async () => {
                calls.push("backup");
                return { snapshotId: "snapshot-1", restorable: true };
            },
            migration: async () => {
                calls.push("migration");
                return { status: "completed", summary: { failed: 0 } };
            },
            createIndexes: async () => calls.push("index-creation"),
            verifyIndexes: async () => ({
                valid: true,
                diagnostics: []
            }),
            schemaCutover: async () => calls.push("schema-cutover"),
            removeLegacyFallback: async () => calls.push("legacy-fallback-removal")
        };
        const result = await runTemporalRollout({
            dryRun: false,
            indexManifest: buildManifest(),
            plans: [buildPlan()],
            indexVerification: { requests: explainRequests() },
            operations
        });

        expect(result.status).to.equal("completed");
        expect(calls).to.deep.equal([
            "backup",
            "migration",
            "index-creation",
            "schema-cutover",
            "legacy-fallback-removal"
        ]);
    });

    it("aborts before fallback removal when schema cutover fails", async function () {
        const calls = [];
        const result = await runTemporalRollout({
            dryRun: false,
            indexManifest: buildManifest(),
            plans: [buildPlan()],
            indexVerification: { requests: explainRequests() },
            operations: {
                preflight: async () => ({
                    valid: true,
                    summary: { invalid: 0, ambiguousBsonDates: 0 }
                }),
                backup: async () => {
                    calls.push("backup");
                    return { snapshotId: "snapshot-1", restorable: true };
                },
                migration: async () => {
                    calls.push("migration");
                    return { status: "completed", summary: { failed: 0 } };
                },
                createIndexes: async () => calls.push("index-creation"),
                verifyIndexes: async () => ({ valid: true }),
                schemaCutover: async () => ({ ok: false }),
                removeLegacyFallback: async () => calls.push("legacy-fallback-removal")
            }
        });

        expect(result.status).to.equal("aborted");
        expect(result.failure.stepId).to.equal("schema-cutover");
        expect(calls).to.deep.equal(["backup", "migration", "index-creation"]);
        expect(calls).to.not.include("legacy-fallback-removal");
        expect(result.rollback.backupRestoreDocument).to.equal(
            "docs/temporal-migration-backup-restore.md"
        );
    });

    it("aborts migration on a failed batch and exposes the restore plan", async function () {
        const result = await runTemporalRollout({
            dryRun: false,
            indexManifest: buildManifest(),
            plans: [buildPlan()],
            indexVerification: { requests: explainRequests() },
            operations: {
                preflight: async () => ({
                    valid: true,
                    summary: { invalid: 0, ambiguousBsonDates: 0 }
                }),
                backup: async () => ({
                    snapshotId: "snapshot-1",
                    restorable: true
                }),
                migration: async () => ({
                    summary: { failed: 1 }
                })
            }
        });

        expect(result.status).to.equal("aborted");
        expect(result.failure.stepId).to.equal("migration");
        expect(result.rollback.onAbort).to.have.length.greaterThan(0);
    });

    it("integrates the existing 7.2 explain validator in dry-run mode", async function () {
        const plan = buildPlan();
        const result = await runTemporalRollout({
            indexManifest: buildManifest(plan),
            plans: [plan],
            indexVerification: { requests: explainRequests(plan) }
        });

        const verification = result.steps.find((step) => step.id === "index-verification");
        expect(result.status).to.equal("planned");
        expect(verification.status).to.equal("validated");
        expect(verification.result.results[0].results.find).to.have.property("explain");
    });
});
