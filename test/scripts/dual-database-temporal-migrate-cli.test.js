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
    databasesAreSame,
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
} = require("../../scripts/lib/dual-database-temporal-migrate-cli");
const {
    TemporalMigrationPreflightError,
    TemporalMigrationWriteError
} = require("@models/FHIR/searchParameter/migration/temporalMigration");

const SOURCE_URI = "mongodb://source-user:source-secret@source-host:27017/burni-source?authSource=admin";
const TARGET_URI = "mongodb://target-user:target-secret@target-host:27017/burni-target?authSource=admin";

describe("dual-database-temporal-migrate CLI", function () {
    it("defaults to preflight-only mode", function () {
        const parsed = parseDualDatabaseTemporalMigrateArgs([]);
        expect(parsed.options.mode).to.equal(MODES.PREFLIGHT);
        expect(parsed.options.batchSize).to.equal(100);
        expect(parsed.options.includeHistory).to.equal(true);
        expect(parsed.options.sourceUri).to.be.null;
        expect(parsed.options.targetUri).to.be.null;
    });

    it("rejects mutually exclusive mode flags", function () {
        const parsed = parseDualDatabaseTemporalMigrateArgs(["--write", "--dry-run"]);
        expect(parsed.error).to.match(/Only one of/);
    });

    it("rejects unknown arguments", function () {
        const parsed = parseDualDatabaseTemporalMigrateArgs(["--unknown-flag"]);
        expect(parsed.error).to.match(/Unknown argument/);
    });

    it("parses source and target URIs with other flags", function () {
        const parsed = parseDualDatabaseTemporalMigrateArgs([
            "--dry-run",
            "--source-uri",
            SOURCE_URI,
            "--target-uri",
            TARGET_URI,
            "--resource",
            "Patient, Encounter",
            "--report",
            "./tmp/custom.json",
            "--audit",
            "./tmp/custom-audit.jsonl",
            "--run-id",
            "run-2026-09-02",
            "--skip-history",
            "--batch-size",
            "250"
        ]);

        expect(parsed.error).to.be.undefined;
        expect(parsed.options.mode).to.equal(MODES.DRY_RUN);
        expect(parsed.options.sourceUri).to.equal(SOURCE_URI);
        expect(parsed.options.targetUri).to.equal(TARGET_URI);
        expect(parsed.options.runId).to.equal("run-2026-09-02");
        expect(parsed.options.batchSize).to.equal(250);
        expect(parsed.options.includeHistory).to.equal(false);
        expect(parseResourceList(parsed.options.resources)).to.deep.equal([
            "Patient",
            "Encounter"
        ]);
        expect(
            resolveReportPath(parsed.options.mode, parsed.options.reportPath)
        ).to.equal("./tmp/custom.json");
        expect(resolveAuditPath(parsed.options.auditPath)).to.equal(
            "./tmp/custom-audit.jsonl"
        );
    });

    it("resolves database names and identities from URIs", function () {
        expect(resolveDatabaseNameFromUri(SOURCE_URI)).to.equal("burni-source");
        expect(resolveDatabaseNameFromUri(TARGET_URI)).to.equal("burni-target");
        expect(resolveDatabaseIdentity(SOURCE_URI)).to.equal(
            "source-host:27017/burni-source"
        );
        expect(resolveDatabaseIdentity(TARGET_URI)).to.equal(
            "target-host:27017/burni-target"
        );
        expect(
            resolveDatabaseIdentity("mongodb+srv://user:pass@cluster.example.net/fhir-prod")
        ).to.equal("cluster.example.net/fhir-prod");
    });

    it("redacts credentials from MongoDB URIs", function () {
        const redactedSource = redactMongoUri(SOURCE_URI);
        const redactedTarget = redactMongoUri(TARGET_URI);

        expect(redactedSource).to.equal(
            "mongodb://source-host:27017/burni-source?authSource=admin"
        );
        expect(redactedTarget).to.equal(
            "mongodb://target-host:27017/burni-target?authSource=admin"
        );
        expect(redactedSource).to.not.include("source-secret");
        expect(redactedSource).to.not.include("source-user");
        expect(redactedTarget).to.not.include("target-secret");
        expect(redactedTarget).to.not.include("target-user");
    });

    it("serializes caught errors without credentials", function () {
        const authError = Object.assign(new Error("Authentication failed."), {
            name: "MongoServerError",
            code: 18
        });
        expect(serializeCaughtError(authError)).to.deep.equal({
            name: "MongoServerError",
            message: "Authentication failed.",
            code: 18
        });

        const uriError = new Error(`failed to connect to ${SOURCE_URI}`);
        const serialized = serializeCaughtError(uriError);
        expect(serialized.message).to.include("source-host:27017/burni-source");
        expect(serialized.message).to.not.include("source-secret");
        expect(serialized.message).to.not.include("source-user");
        expect(serializeCaughtError(undefined)).to.equal(undefined);
    });

    it("detects when source and target resolve to the same database", function () {
        const sameHostDifferentDb = databasesAreSame(
            "mongodb://localhost:27017/db-a",
            "mongodb://localhost:27017/db-b"
        );
        const sameDbDifferentCredentials = databasesAreSame(
            "mongodb://user-a:pass-a@localhost:27017/shared-db",
            "mongodb://user-b:pass-b@localhost:27017/shared-db"
        );
        const differentHosts = databasesAreSame(
            "mongodb://host-a:27017/shared-db",
            "mongodb://host-b:27017/shared-db"
        );

        expect(sameHostDifferentDb).to.equal(false);
        expect(sameDbDifferentCredentials).to.equal(true);
        expect(differentHosts).to.equal(false);
    });

    it("requires both source-uri and target-uri", function () {
        const missingSource = validateDualDatabaseTemporalMigrateOptions({
            mode: MODES.PREFLIGHT,
            targetUri: TARGET_URI,
            batchSize: 100
        });
        const missingTarget = validateDualDatabaseTemporalMigrateOptions({
            mode: MODES.PREFLIGHT,
            sourceUri: SOURCE_URI,
            batchSize: 100
        });

        expect(missingSource.error).to.match(/--source-uri is required/);
        expect(missingTarget.error).to.match(/--target-uri is required/);

        const missingSourceDatabase = validateDualDatabaseTemporalMigrateOptions({
            mode: MODES.PREFLIGHT,
            sourceUri: "mongodb://localhost:27017",
            targetUri: TARGET_URI,
            batchSize: 100
        });
        expect(missingSourceDatabase.error).to.match(/source-uri must include a database name/);
    });

    it("rejects same source and target database during validation", function () {
        const validation = validateDualDatabaseTemporalMigrateOptions({
            mode: MODES.PREFLIGHT,
            sourceUri: "mongodb://localhost:27017/shared-db",
            targetUri: "mongodb://localhost:27017/shared-db",
            batchSize: 100
        });

        expect(validation.error).to.match(/same database identity/);
    });

    it("requires confirm-target for write mode", function () {
        const parsed = parseDualDatabaseTemporalMigrateArgs([
            "--write",
            "--source-uri",
            SOURCE_URI,
            "--target-uri",
            TARGET_URI
        ]);
        const validation = validateDualDatabaseTemporalMigrateOptions(parsed.options);

        expect(validation.error).to.match(/requires --confirm-target/);
    });

    it("rejects confirm-target mismatches", function () {
        const parsed = parseDualDatabaseTemporalMigrateArgs([
            "--write",
            "--source-uri",
            SOURCE_URI,
            "--target-uri",
            TARGET_URI,
            "--confirm-target",
            "wrong-db"
        ]);
        const validation = validateDualDatabaseTemporalMigrateOptions(parsed.options);

        expect(validation.error).to.match(/does not match target database/);
    });

    it("rejects confirm-target outside write mode", function () {
        const parsed = parseDualDatabaseTemporalMigrateArgs([
            "--preflight-only",
            "--source-uri",
            SOURCE_URI,
            "--target-uri",
            TARGET_URI,
            "--confirm-target",
            "burni-target"
        ]);
        const validation = validateDualDatabaseTemporalMigrateOptions(parsed.options);

        expect(validation.error).to.match(/only valid with --write/);
    });

    it("accepts write mode when confirm-target matches target URI database", function () {
        const parsed = parseDualDatabaseTemporalMigrateArgs([
            "--write",
            "--source-uri",
            SOURCE_URI,
            "--target-uri",
            TARGET_URI,
            "--confirm-target",
            "burni-target"
        ]);
        const validation = validateDualDatabaseTemporalMigrateOptions(parsed.options);

        expect(validation.error).to.be.undefined;
        expect(parsed.options.mode).to.equal(MODES.WRITE);
    });

    it("builds default evidence paths by mode", function () {
        const now = new Date("2026-09-01T12:34:56.789Z");
        expect(resolveReportPath(MODES.PREFLIGHT, null, now)).to.equal(
            path.join("evidence", "dual-temporal-preflight-2026-09-01T12-34-56-789Z.json")
        );
        expect(resolveReportPath(MODES.DRY_RUN, null, now)).to.equal(
            path.join("evidence", "dual-temporal-migration-2026-09-01T12-34-56-789Z.json")
        );
        expect(resolveAuditPath(null, now)).to.equal(
            path.join("evidence", "dual-temporal-audit-2026-09-01T12-34-56-789Z.jsonl")
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
                    code: "DUAL_DATABASE_TEMPORAL_MIGRATE_USAGE"
                })
            })
        ).to.equal(EXIT_USAGE);
        expect(
            resolveExitCode({
                error: new Error("mongodb connection rejected")
            })
        ).to.equal(EXIT_WRITE_FAILED);
    });
});
