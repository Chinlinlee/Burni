const fs = require("fs");
const {
    CONVERSION_POLICY
} = require("./temporalConversion");

const LOSSY_POLICIES = new Set([
    CONVERSION_POLICY.UTC_CALENDAR_DAY_LOSSY,
    CONVERSION_POLICY.UTC_ABSOLUTE_TIME_LOSSY
]);

const REQUIRED_AUDIT_FIELDS = [
    "sourceDatabaseIdentity",
    "sourceCollection",
    "sourceDocumentId",
    "fhirPath",
    "temporalType",
    "policy",
    "originalValue",
    "generatedValue"
];

/**
 * @param {string} code
 * @param {string} message
 * @param {Record<string, unknown>} [details]
 */
function diagnostic(code, message, details = {}) {
    return { code, message, ...details };
}

/**
 * @param {unknown} value
 * @returns {unknown}
 */
function normalizeAuditDocumentId(value) {
    if (
        value !== null &&
        typeof value === "object" &&
        typeof /** @type {{ toString?: () => string }} */ (value).toString === "function" &&
        Object.prototype.hasOwnProperty.call(value, "_bsontype")
    ) {
        return value.toString();
    }
    return value;
}

/**
 * @param {string} auditPath
 * @returns {Record<string, unknown>[]}
 */
function readAuditRecords(auditPath) {
    if (!auditPath || !fs.existsSync(auditPath)) {
        return [];
    }

    const content = fs.readFileSync(auditPath, "utf8").trim();
    if (!content) {
        return [];
    }

    if (auditPath.endsWith(".json")) {
        const parsed = JSON.parse(content);
        return Array.isArray(parsed) ? parsed : [];
    }

    return content
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => JSON.parse(line));
}

/**
 * @param {Record<string, unknown>} record
 * @returns {string[]}
 */
function validateAuditRecordShape(record) {
    const errors = [];
    for (const field of REQUIRED_AUDIT_FIELDS) {
        if (record[field] === undefined || record[field] === null) {
            errors.push(`Missing audit field: ${field}`);
        }
    }
    return errors;
}

/**
 * @param {object} input
 * @param {string} [input.auditPath]
 * @param {number} [input.expectedLossyCount]
 * @param {object} [input.migrationSummary]
 * @param {object} [input.preflightSummary]
 * @returns {{
 *   valid: boolean,
 *   diagnostics: Array<object>,
 *   summary: {
 *     expectedLossyCount: number,
 *     auditRecordCount: number,
 *     lossyAuditRecordCount: number,
 *     invalidRecordCount: number
 *   }
 * }}
 */
function verifyAuditCompleteness({
    auditPath,
    expectedLossyCount,
    migrationSummary,
    preflightSummary
} = {}) {
    const expected =
        expectedLossyCount ??
        migrationSummary?.lossyAuditCount ??
        migrationSummary?.auditLossyCount ??
        preflightSummary?.lossyBsonDates ??
        preflightSummary?.absoluteBsonDates ??
        0;
    const records = auditPath ? readAuditRecords(auditPath) : [];
    const diagnostics = [];
    const lossyRecords = records.filter((record) => LOSSY_POLICIES.has(record.policy));
    let invalidRecordCount = 0;

    for (const record of records) {
        const shapeErrors = validateAuditRecordShape(record);
        if (shapeErrors.length > 0) {
            invalidRecordCount += 1;
            diagnostics.push(
                diagnostic(
                    "temporal-audit-record-invalid",
                    "Audit record is missing required fields",
                    {
                        sourceCollection: record.sourceCollection,
                        sourceDocumentId: normalizeAuditDocumentId(record.sourceDocumentId),
                        fhirPath: record.fhirPath,
                        errors: shapeErrors
                    }
                )
            );
        }
    }

    if (expected > 0 && !auditPath) {
        diagnostics.push(
            diagnostic(
                "temporal-audit-artifact-missing",
                "Lossy BSON conversions were reported but no audit artifact path was provided",
                { expectedLossyCount: expected }
            )
        );
    }

    if (expected > 0 && auditPath && records.length === 0) {
        diagnostics.push(
            diagnostic(
                "temporal-audit-artifact-empty",
                "Audit artifact is empty but lossy BSON conversions were expected",
                { expectedLossyCount: expected, auditPath }
            )
        );
    }

    if (lossyRecords.length < expected) {
        diagnostics.push(
            diagnostic(
                "temporal-audit-lossy-count-mismatch",
                "Audit artifact does not contain an entry for every reported lossy BSON conversion",
                {
                    expectedLossyCount: expected,
                    lossyAuditRecordCount: lossyRecords.length,
                    auditPath
                }
            )
        );
    }

    return {
        valid: diagnostics.length === 0,
        diagnostics,
        summary: {
            expectedLossyCount: expected,
            auditRecordCount: records.length,
            lossyAuditRecordCount: lossyRecords.length,
            invalidRecordCount
        }
    };
}

module.exports = {
    LOSSY_POLICIES,
    readAuditRecords,
    verifyAuditCompleteness
};
