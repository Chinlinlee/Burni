require("module-alias/register");

const { expect } = require("chai");
const { createSearchQueryPlan } = require("@models/FHIR/searchParameter/compiler/searchQueryPlan");
const { generateTemporalIndexManifest } = require("@models/FHIR/searchParameter/indexes/indexGenerator");
const {
    validateBackupRestoreability,
    verifyTemporalCutover,
    requiresDualDatabaseVerification
} = require("@models/FHIR/searchParameter/migration/temporalCutoverGate");
const {
    runTemporalRollout
} = require("@models/FHIR/searchParameter/migration/temporalRollout");

function buildPlan() {
    return createSearchQueryPlan({
        canonicalKey: "http://example.org/SearchParameter/observation-effective::4.0.1",
        resourceType: "Observation",
        code: "effective",
        searchType: "date",
        extractionPaths: [{ path: "effectiveDateTime", datatype: "dateTime" }],
        comparators: ["eq"]
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

function validOptions(overrides = {}) {
    return {
        indexManifest: buildManifest(),
        plans: [buildPlan()],
        migrationResult: { status: "completed", summary: { failed: 0 } },
        preflightResult: {
            valid: true,
            diagnostics: [],
            summary: {
                invalid: 0,
                lossyBsonDates: 0,
                unresolvedAmbiguousBsonDates: 0,
                unavailableSources: 0
            }
        },
        backupResult: { snapshotId: "snapshot-1", restorable: true },
        indexVerificationResult: { valid: true, diagnostics: [] },
        ...overrides
    };
}

describe("temporal cutover completion gate", function () {
    it("fails when migration completion is missing", async function () {
        const result = await verifyTemporalCutover(
            validOptions({ migrationResult: undefined })
        );

        expect(result.valid).to.equal(false);
        expect(result.diagnostics.map((entry) => entry.code)).to.include(
            "temporal-migration-completion-missing"
        );
        expect(result.activationAllowed).to.equal(false);
    });

    it("fails for invalid preflight data", async function () {
        const result = await verifyTemporalCutover(
            validOptions({
                preflightResult: {
                    valid: false,
                    diagnostics: [{ category: "invalid", path: "birthDate" }],
                    summary: { invalid: 1, unresolvedAmbiguousBsonDates: 0 }
                }
            })
        );

        expect(result.valid).to.equal(false);
        expect(result.summary.unresolvedInvalidDiagnostics).to.equal(1);
    });

    it("fails for unresolved ambiguous preflight diagnostics", async function () {
        const result = await verifyTemporalCutover(
            validOptions({
                preflightResult: {
                    valid: true,
                    diagnostics: [
                        { category: "ambiguous-bson-date", path: "birthDate" }
                    ],
                    summary: { invalid: 0, unresolvedAmbiguousBsonDates: 0 }
                }
            })
        );

        expect(result.valid).to.equal(false);
        expect(result.summary.unresolvedAmbiguousDiagnostics).to.equal(1);
    });

    it("allows cutover when preflight reports lossy BSON dates without unresolved ambiguous values", async function () {
        const result = await verifyTemporalCutover(
            validOptions({
                preflightResult: {
                    valid: true,
                    diagnostics: [],
                    summary: {
                        invalid: 0,
                        unresolvedAmbiguousBsonDates: 0,
                        lossyBsonDates: 5,
                        unavailableSources: 0
                    }
                }
            })
        );

        expect(result.valid).to.equal(true);
        expect(result.summary.preflightValid).to.equal(true);
        expect(result.summary.lossyBsonDates).to.equal(5);
        expect(result.summary.unresolvedAmbiguousDiagnostics).to.equal(0);
    });

    it("fails when the backup is not restoreable", async function () {
        const result = await verifyTemporalCutover(
            validOptions({ backupResult: { snapshotId: "snapshot-1" } })
        );

        expect(result.valid).to.equal(false);
        expect(result.diagnostics.map((entry) => entry.code)).to.include(
            "temporal-backup-restoreability-missing"
        );
        expect(validateBackupRestoreability({ restoreable: true }).valid).to.equal(
            true
        );
    });

    it("fails when manifest compatibility is invalid", async function () {
        const manifest = buildManifest();
        manifest.indexes[0].bsonType = "string";
        const result = await verifyTemporalCutover(
            validOptions({ indexManifest: manifest })
        );

        expect(result.valid).to.equal(false);
        expect(result.diagnostics.map((entry) => entry.code)).to.include(
            "temporal-index-manifest-invalid"
        );
    });

    it("fails when explain verification is invalid", async function () {
        const result = await verifyTemporalCutover(
            validOptions({
                indexVerificationResult: {
                    valid: false,
                    diagnostics: [{ code: "explain-failed" }]
                }
            })
        );

        expect(result.valid).to.equal(false);
        expect(result.diagnostics.map((entry) => entry.code)).to.include(
            "explain-failed"
        );
    });

    it("returns an auditable successful read-only gate", async function () {
        const result = await verifyTemporalCutover(validOptions());

        expect(result).to.include({
            kind: "fhir-temporal-cutover-completion-gate",
            version: 1,
            valid: true,
            readOnly: true,
            activationAllowed: true
        });
        expect(result.summary).to.include({
            migrationComplete: true,
            preflightValid: true,
            backupRestorable: true,
            indexCompatible: true,
            explainValid: true,
            diagnosticCount: 0
        });
        expect(result.rollback.required).to.equal(false);
    });

    it("accepts injected status and verification providers without writes", async function () {
        const calls = [];
        const result = await verifyTemporalCutover({
            indexManifest: buildManifest(),
            plans: [buildPlan()],
            migrationStatusProvider: ({ readOnly }) => {
                calls.push(["migration", readOnly]);
                return { complete: true };
            },
            preflightStatusProvider: ({ readOnly }) => {
                calls.push(["preflight", readOnly]);
                return {
                    valid: true,
                    diagnostics: [],
                    summary: { invalid: 0, unresolvedAmbiguousBsonDates: 0 }
                };
            },
            backupResult: { snapshotId: "snapshot-1" },
            backupVerifier: ({ backup, readOnly }) => {
                calls.push(["backup", readOnly]);
                return { valid: backup.snapshotId === "snapshot-1" };
            },
            indexVerifier: ({ readOnly }) => {
                calls.push(["index", readOnly]);
                return { valid: true, diagnostics: [] };
            }
        });

        expect(result.valid).to.equal(true);
        expect(calls).to.deep.equal([
            ["migration", true],
            ["preflight", true],
            ["backup", true],
            ["index", true]
        ]);
    });

    it("does not activate or remove fallback when the gate fails", async function () {
        const calls = [];
        const result = await runTemporalRollout({
            dryRun: false,
            indexManifest: buildManifest(),
            plans: [buildPlan()],
            indexVerification: { requests: [{ plan: buildPlan(), rawValue: "2020" }] },
            operations: {
                preflight: async () => ({
                    valid: true,
                    diagnostics: [],
                    summary: { invalid: 0, unresolvedAmbiguousBsonDates: 0 }
                }),
                backup: async () => ({
                    snapshotId: "snapshot-1",
                    restorable: true
                }),
                migration: async () => ({
                    status: "completed",
                    summary: { failed: 0 }
                }),
                createIndexes: async () => calls.push("indexes"),
                verifyIndexes: async () => ({ valid: true }),
                schemaCutover: async () => calls.push("schema"),
                removeLegacyFallback: async () => calls.push("fallback")
            },
            cutoverGate: async () => ({
                valid: false,
                diagnostics: [{ code: "gate-failed" }]
            })
        });

        expect(result.status).to.equal("aborted");
        expect(result.failure.stepId).to.equal("cutover-completion-gate");
        expect(calls).to.deep.equal(["indexes"]);
    });

    it("runs activation before fallback removal only after a successful gate", async function () {
        const calls = [];
        const result = await runTemporalRollout({
            dryRun: false,
            indexManifest: buildManifest(),
            plans: [buildPlan()],
            indexVerification: { requests: [{ plan: buildPlan(), rawValue: "2020" }] },
            operations: {
                preflight: async () => ({
                    valid: true,
                    diagnostics: [],
                    summary: { invalid: 0, unresolvedAmbiguousBsonDates: 0 }
                }),
                backup: async () => ({
                    snapshotId: "snapshot-1",
                    restorable: true
                }),
                migration: async () => ({
                    status: "completed",
                    summary: { failed: 0 }
                }),
                createIndexes: async () => calls.push("indexes"),
                verifyIndexes: async () => ({ valid: true }),
                removeLegacyFallback: async () => calls.push("fallback")
            },
            activationAdapter: async () => calls.push("activation")
        });

        expect(result.status).to.equal("completed");
        expect(calls).to.deep.equal(["indexes", "activation", "fallback"]);
    });

    it("can rerun the read-only gate idempotently", async function () {
        const first = await verifyTemporalCutover(validOptions());
        const second = await verifyTemporalCutover(validOptions());

        expect(second.valid).to.equal(first.valid);
        expect(second.diagnostics).to.deep.equal(first.diagnostics);
        expect(second.readOnly).to.equal(true);
        expect(second.activationAllowed).to.equal(true);
    });

    it("skips dual-database verification gates when not configured", async function () {
        const result = await verifyTemporalCutover(validOptions());

        expect(requiresDualDatabaseVerification({})).to.equal(false);
        expect(result.gates.sourceTargetComparison.skipped).to.equal(true);
        expect(result.gates.auditCompleteness.skipped).to.equal(true);
        expect(result.gates.searchVerification.skipped).to.equal(true);
        expect(result.gates.targetPreflight.skipped).to.equal(true);
        expect(result.summary.sourceTargetComparisonValid).to.equal(null);
    });

    it("requires dual-database verification gates when explicitly enabled", async function () {
        const result = await verifyTemporalCutover({
            ...validOptions(),
            requireDualDatabaseVerification: true
        });

        expect(result.valid).to.equal(false);
        expect(result.gates.sourceTargetComparison.valid).to.equal(false);
        expect(result.gates.auditCompleteness.valid).to.equal(false);
        expect(result.gates.searchVerification.valid).to.equal(false);
        expect(result.gates.targetPreflight.valid).to.equal(false);
        expect(result.summary.dualDatabaseVerificationRequired).to.equal(true);
    });

    it("wires injected dual-database verification results into the cutover gate", async function () {
        const result = await verifyTemporalCutover({
            ...validOptions(),
            requireDualDatabaseVerification: true,
            sourceTargetComparisonResult: { valid: true, diagnostics: [] },
            auditCompletenessResult: { valid: true, diagnostics: [] },
            searchVerificationResult: { valid: true, diagnostics: [] },
            targetPreflightResult: {
                valid: true,
                diagnostics: [],
                summary: { invalid: 0, unresolvedAmbiguousBsonDates: 0 }
            }
        });

        expect(result.valid).to.equal(true);
        expect(result.gates.sourceTargetComparison.valid).to.equal(true);
        expect(result.gates.auditCompleteness.valid).to.equal(true);
        expect(result.gates.searchVerification.valid).to.equal(true);
        expect(result.gates.targetPreflight.valid).to.equal(true);
        expect(result.summary.sourceTargetComparisonValid).to.equal(true);
        expect(result.summary.auditCompletenessValid).to.equal(true);
        expect(result.summary.searchVerificationValid).to.equal(true);
        expect(result.summary.targetPreflightValid).to.equal(true);
    });

    it("fails dual-database cutover when injected source/target comparison is invalid", async function () {
        const result = await verifyTemporalCutover({
            ...validOptions(),
            sourceTargetComparisonResult: {
                valid: false,
                diagnostics: [{ code: "source-target-count-mismatch" }]
            }
        });

        expect(result.valid).to.equal(false);
        expect(result.diagnostics.map((entry) => entry.code)).to.include(
            "source-target-count-mismatch"
        );
    });
});
