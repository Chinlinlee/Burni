require("module-alias/register");

const path = require("path");
const os = require("os");
const fs = require("fs");
const { expect } = require("chai");
const {
    CONVERSION_POLICY
} = require("@models/FHIR/searchParameter/migration/temporalConversion");
const {
    readAuditRecords,
    verifyAuditCompleteness
} = require("@models/FHIR/searchParameter/migration/auditCompleteness");

function writeAuditJsonl(filePath, records) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(
        filePath,
        `${records.map((record) => JSON.stringify(record)).join("\n")}\n`,
        "utf8"
    );
}

function lossyAuditRecord(overrides = {}) {
    return {
        sourceDatabaseIdentity: "localhost/source",
        sourceCollection: "Patient",
        sourceDocumentId: "doc-1",
        fhirPath: "birthDate",
        temporalType: "date",
        policy: CONVERSION_POLICY.UTC_CALENDAR_DAY_LOSSY,
        originalValue: "2020-01-01T00:00:00.000Z",
        generatedValue: {
            value: "2020-01-01",
            precision: "day"
        },
        ...overrides
    };
}

describe("audit completeness verification", function () {
    /** @type {string} */
    let tempDir;

    beforeEach(function () {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "audit-completeness-"));
    });

    afterEach(function () {
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it("passes when lossy audit records match the expected count", function () {
        const auditPath = path.join(tempDir, "audit.jsonl");
        writeAuditJsonl(auditPath, [lossyAuditRecord(), lossyAuditRecord({ fhirPath: "deceasedDateTime" })]);

        const result = verifyAuditCompleteness({
            auditPath,
            expectedLossyCount: 2
        });

        expect(result.valid).to.equal(true);
        expect(result.summary.lossyAuditRecordCount).to.equal(2);
    });

    it("fails when lossy audit records are missing for reported conversions", function () {
        const auditPath = path.join(tempDir, "audit.jsonl");
        writeAuditJsonl(auditPath, [lossyAuditRecord()]);

        const result = verifyAuditCompleteness({
            auditPath,
            preflightSummary: { lossyBsonDates: 3 }
        });

        expect(result.valid).to.equal(false);
        expect(result.diagnostics.map((entry) => entry.code)).to.include(
            "temporal-audit-lossy-count-mismatch"
        );
    });

    it("fails when audit artifact is missing but lossy conversions were expected", function () {
        const result = verifyAuditCompleteness({
            preflightSummary: { lossyBsonDates: 1 }
        });

        expect(result.valid).to.equal(false);
        expect(result.diagnostics.map((entry) => entry.code)).to.include(
            "temporal-audit-artifact-missing"
        );
    });

    it("fails when audit records are missing required fields", function () {
        const auditPath = path.join(tempDir, "audit.jsonl");
        writeAuditJsonl(auditPath, [{ policy: CONVERSION_POLICY.UTC_CALENDAR_DAY_LOSSY }]);

        const result = verifyAuditCompleteness({
            auditPath,
            expectedLossyCount: 1
        });

        expect(result.valid).to.equal(false);
        expect(result.diagnostics.map((entry) => entry.code)).to.include(
            "temporal-audit-record-invalid"
        );
    });

    it("reads JSONL audit records", function () {
        const auditPath = path.join(tempDir, "audit.jsonl");
        writeAuditJsonl(auditPath, [lossyAuditRecord()]);

        expect(readAuditRecords(auditPath)).to.have.length(1);
    });
});
