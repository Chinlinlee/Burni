require("module-alias/register");

const fs = require("fs");
const os = require("os");
const path = require("path");
const { expect } = require("chai");
const mongoose = require("mongoose");
const { createAuditWriter } = require("@models/FHIR/searchParameter/migration/auditWriter");
const { validateAuditRecord } = require("@models/FHIR/searchParameter/migration/migrationContracts");

/** @type {string} */
let tempDir = "";

function auditRecord(overrides = {}) {
    return {
        sourceDatabaseIdentity: "source-db",
        sourceCollection: "Patient",
        sourceDocumentId: "doc-1",
        fhirPath: "birthDate",
        temporalType: "date",
        policy: "utc-calendar-day-lossy",
        originalValue: new Date("2020-01-15T12:34:56.789Z"),
        generatedValue: {
            value: "2020-01-15",
            precision: "day",
            normalizedStart: "2020-01-15",
            normalizedEnd: "2020-01-16"
        },
        ...overrides
    };
}

function artifactPath(name) {
    return path.join(tempDir, name);
}

describe("audit writer", function () {
    beforeEach(function () {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "audit-writer-test-"));
    });

    afterEach(function () {
        if (tempDir && fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
        tempDir = "";
    });

    it("append + flush writes valid JSONL with required AuditRecord fields", async function () {
        const filePath = artifactPath("audit.jsonl");
        const writer = createAuditWriter({
            runId: "run-1",
            artifactPath: filePath
        });

        await writer.append([auditRecord()]);
        await writer.flush();

        expect(fs.existsSync(filePath)).to.equal(true);
        const lines = fs.readFileSync(filePath, "utf8").trim().split("\n");
        expect(lines).to.have.length(1);

        const parsed = JSON.parse(lines[0]);
        expect(parsed).to.include({
            sourceDatabaseIdentity: "source-db",
            sourceCollection: "Patient",
            sourceDocumentId: "doc-1",
            fhirPath: "birthDate",
            temporalType: "date",
            policy: "utc-calendar-day-lossy"
        });
        expect(parsed).to.have.property("originalValue", "2020-01-15T12:34:56.789Z");
        expect(parsed.generatedValue).to.deep.equal({
            value: "2020-01-15",
            precision: "day",
            normalizedStart: "2020-01-15",
            normalizedEnd: "2020-01-16"
        });
        validateAuditRecord(parsed);
    });

    it("serializes Date originalValue as ISO string", async function () {
        const filePath = artifactPath("date-serialization.jsonl");
        const writer = createAuditWriter({
            runId: "run-1",
            artifactPath: filePath
        });
        const originalDate = new Date("2019-07-04T08:00:00.000Z");

        await writer.append([
            auditRecord({
                originalValue: originalDate
            })
        ]);
        await writer.flush();

        const parsed = JSON.parse(fs.readFileSync(filePath, "utf8").trim());
        expect(parsed.originalValue).to.equal(originalDate.toISOString());
        validateAuditRecord(parsed);
    });

    it("serializes Decimal128 in generatedValue as string", async function () {
        const filePath = artifactPath("decimal-serialization.jsonl");
        const writer = createAuditWriter({
            runId: "run-1",
            artifactPath: filePath
        });
        const epochSeconds = mongoose.Types.Decimal128.fromString("1577836800.123");

        await writer.append([
            auditRecord({
                fhirPath: "deceasedDateTime",
                temporalType: "dateTime",
                policy: "utc-absolute-time-lossy",
                generatedValue: {
                    value: "2020-01-01T00:00:00.000Z",
                    precision: "instant",
                    epochSeconds
                }
            })
        ]);
        await writer.flush();

        const parsed = JSON.parse(fs.readFileSync(filePath, "utf8").trim());
        expect(parsed.generatedValue.epochSeconds).to.equal("1577836800.123");
        expect(parsed.generatedValue.epochSeconds).to.be.a("string");
        validateAuditRecord(parsed);
    });

    it("getArtifactPath returns configured path", function () {
        const filePath = artifactPath("configured-path.jsonl");
        const writer = createAuditWriter({
            runId: "run-1",
            artifactPath: filePath
        });

        expect(writer.getArtifactPath()).to.equal(filePath);
    });

    it("multiple append calls accumulate before flush", async function () {
        const filePath = artifactPath("accumulated.jsonl");
        const writer = createAuditWriter({
            runId: "run-1",
            artifactPath: filePath
        });

        await writer.append([
            auditRecord({
                sourceDocumentId: "doc-1",
                fhirPath: "birthDate"
            })
        ]);
        await writer.append([
            auditRecord({
                sourceDocumentId: "doc-2",
                fhirPath: "deceasedDateTime",
                temporalType: "dateTime",
                policy: "utc-absolute-time-lossy",
                originalValue: new Date("2021-02-03T00:00:00.000Z"),
                generatedValue: {
                    value: "2021-02-03T00:00:00.000Z",
                    precision: "instant"
                }
            })
        ]);
        await writer.flush();

        const lines = fs.readFileSync(filePath, "utf8").trim().split("\n");
        expect(lines).to.have.length(2);

        const first = JSON.parse(lines[0]);
        const second = JSON.parse(lines[1]);
        expect(first.sourceDocumentId).to.equal("doc-1");
        expect(first.fhirPath).to.equal("birthDate");
        expect(second.sourceDocumentId).to.equal("doc-2");
        expect(second.fhirPath).to.equal("deceasedDateTime");
        validateAuditRecord(first);
        validateAuditRecord(second);
    });

    it("creates parent directories when needed", async function () {
        const filePath = path.join(tempDir, "nested", "dir", "audit.jsonl");
        const writer = createAuditWriter({
            runId: "run-1",
            artifactPath: filePath
        });

        await writer.append([auditRecord()]);
        await writer.flush();

        expect(fs.existsSync(filePath)).to.equal(true);
    });
});
