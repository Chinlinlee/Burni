require("module-alias/register");

const path = require("path");
const { expect } = require("chai");
const {
    EXIT_PREFLIGHT_FAILED,
    EXIT_SUCCESS,
    EXIT_USAGE,
    EXIT_WRITE_FAILED,
    MODES,
    buildPartialMigrationWarnings,
    parseResourceList,
    parseTemporalMigrateArgs,
    resolveConfiguredDatabaseName,
    resolveExitCode,
    resolveReportPath,
    validateTemporalMigrateOptions
} = require("../../scripts/lib/temporal-migrate-cli");
const {
    TemporalMigrationPreflightError,
    TemporalMigrationWriteError
} = require("@models/FHIR/searchParameter/migration/temporalMigration");

describe("temporal-migrate CLI", function () {
    it("defaults to preflight-only mode", function () {
        const parsed = parseTemporalMigrateArgs([]);
        expect(parsed.options.mode).to.equal(MODES.PREFLIGHT);
        expect(parsed.options.batchSize).to.equal(100);
        expect(parsed.options.includeHistory).to.equal(true);
    });

    it("rejects mutually exclusive mode flags", function () {
        const parsed = parseTemporalMigrateArgs(["--write", "--dry-run"]);
        expect(parsed.error).to.match(/Only one of/);
    });

    it("resolves configured database name from MONGODB_NAME or connection URL", function () {
        expect(
            resolveConfiguredDatabaseName({
                MONGODB_NAME: "FHIRTest"
            })
        ).to.equal("FHIRTest");
        expect(
            resolveConfiguredDatabaseName({
                MONGODB_CONNECTION_URL: "mongodb://localhost:27017/FHIRTest"
            })
        ).to.equal("FHIRTest");
        expect(resolveConfiguredDatabaseName({})).to.be.undefined;
    });

    it("requires confirm-db for write mode", function () {
        const parsed = parseTemporalMigrateArgs(["--write"]);
        const validation = validateTemporalMigrateOptions(parsed.options, {
            MONGODB_NAME: "burni-prod"
        });
        expect(validation.error).to.match(/requires --confirm-db/);
    });

    it("rejects confirm-db mismatches", function () {
        const parsed = parseTemporalMigrateArgs([
            "--write",
            "--confirm-db",
            "wrong-db"
        ]);
        const validation = validateTemporalMigrateOptions(parsed.options, {
            MONGODB_NAME: "burni-prod"
        });
        expect(validation.error).to.match(/does not match configured database/);
    });

    it("accepts write mode when confirm-db matches", function () {
        const parsed = parseTemporalMigrateArgs([
            "--write",
            "--confirm-db",
            "burni-prod",
            "--batch-size",
            "250"
        ]);
        const validation = validateTemporalMigrateOptions(parsed.options, {
            MONGODB_NAME: "burni-prod"
        });
        expect(validation.error).to.be.undefined;
        expect(parsed.options.mode).to.equal(MODES.WRITE);
        expect(parsed.options.batchSize).to.equal(250);
    });

    it("parses resource lists and report paths", function () {
        const parsed = parseTemporalMigrateArgs([
            "--dry-run",
            "--resource",
            "Patient, Encounter",
            "--report",
            "./tmp/custom.json",
            "--skip-history"
        ]);
        expect(parsed.options.mode).to.equal(MODES.DRY_RUN);
        expect(parseResourceList(parsed.options.resources)).to.deep.equal([
            "Patient",
            "Encounter"
        ]);
        expect(parsed.options.includeHistory).to.equal(false);
        expect(
            resolveReportPath(parsed.options.mode, parsed.options.reportPath)
        ).to.equal("./tmp/custom.json");
    });

    it("builds default evidence paths by mode", function () {
        const now = new Date("2026-09-01T12:34:56.789Z");
        expect(resolveReportPath(MODES.PREFLIGHT, null, now)).to.equal(
            path.join("evidence", "temporal-preflight-2026-09-01T12-34-56-789Z.json")
        );
        expect(resolveReportPath(MODES.DRY_RUN, null, now)).to.equal(
            path.join("evidence", "temporal-migration-2026-09-01T12-34-56-789Z.json")
        );
    });

    it("warns when partial resource migration is requested", function () {
        const warnings = buildPartialMigrationWarnings(MODES.WRITE, ["Patient"], 146);
        expect(warnings).to.have.length(1);
        expect(warnings[0]).to.match(/partial write/);
        expect(warnings[0]).to.match(/Production rollout must preflight the full catalog/);
    });

    it("maps outcomes to exit codes", function () {
        expect(resolveExitCode({ preflightValid: true })).to.equal(EXIT_SUCCESS);
        expect(
            resolveExitCode({
                preflightValid: false
            })
        ).to.equal(EXIT_PREFLIGHT_FAILED);
        expect(
            resolveExitCode({
                summary: { failed: 1 },
                preflightValid: true
            })
        ).to.equal(EXIT_WRITE_FAILED);
        expect(
            resolveExitCode({
                error: new TemporalMigrationPreflightError({
                    valid: false,
                    diagnostics: [],
                    summary: {}
                })
            })
        ).to.equal(EXIT_PREFLIGHT_FAILED);
        expect(
            resolveExitCode({
                error: new TemporalMigrationWriteError("write failed", {}, { failed: 1 })
            })
        ).to.equal(EXIT_WRITE_FAILED);
        expect(
            resolveExitCode({
                error: Object.assign(new Error("usage"), {
                    code: "TEMPORAL_MIGRATE_USAGE"
                })
            })
        ).to.equal(EXIT_USAGE);
        expect(
            resolveExitCode({
                error: new Error("mongodb.ready rejected")
            })
        ).to.equal(EXIT_WRITE_FAILED);
    });
});
