const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isDecimal128(value) {
    return (
        value instanceof mongoose.Types.Decimal128 ||
        (value !== null &&
            typeof value === "object" &&
            /** @type {{ _bsontype?: string }} */ (value)._bsontype === "Decimal128")
    );
}

/**
 * @param {unknown} value
 * @returns {unknown}
 */
function serializeOriginalValue(value) {
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (Array.isArray(value)) {
        return value.map(serializeOriginalValue);
    }
    if (value !== null && typeof value === "object") {
        /** @type {Record<string, unknown>} */
        const result = {};
        for (const [key, entry] of Object.entries(value)) {
            result[key] = serializeOriginalValue(entry);
        }
        return result;
    }
    return value;
}

/**
 * @param {unknown} value
 * @returns {unknown}
 */
function serializeGeneratedValue(value) {
    if (isDecimal128(value)) {
        return value.toString();
    }
    if (Array.isArray(value)) {
        return value.map(serializeGeneratedValue);
    }
    if (value !== null && typeof value === "object") {
        /** @type {Record<string, unknown>} */
        const result = {};
        for (const [key, entry] of Object.entries(value)) {
            result[key] = serializeGeneratedValue(entry);
        }
        return result;
    }
    return value;
}

/**
 * @param {unknown} value
 * @returns {unknown}
 */
function serializeSourceDocumentId(value) {
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
 * @param {import("./migrationContracts").AuditRecord} record
 * @returns {Record<string, unknown>}
 */
function serializeAuditRecord(record) {
    return {
        sourceDatabaseIdentity: record.sourceDatabaseIdentity,
        sourceCollection: record.sourceCollection,
        sourceDocumentId: serializeSourceDocumentId(record.sourceDocumentId),
        fhirPath: record.fhirPath,
        temporalType: record.temporalType,
        policy: record.policy,
        originalValue: serializeOriginalValue(record.originalValue),
        generatedValue: serializeGeneratedValue(record.generatedValue)
    };
}

/**
 * @param {object} config
 * @returns {import("./migrationContracts").AuditWriter}
 */
function createStubAuditWriter(config) {
    /** @type {import("./migrationContracts").AuditRecord[]} */
    const buffer = [];

    return {
        async append(records) {
            buffer.push(...records);
        },
        async flush() {},
        getArtifactPath() {
            return config.artifactPath;
        }
    };
}

/**
 * @param {object} config
 * @param {string} config.runId
 * @param {string} config.artifactPath
 * @param {"jsonl" | "json"} [config.format]
 * @returns {import("./migrationContracts").AuditWriter}
 */
function createAuditWriter(config) {
    const artifactPath = config.artifactPath;
    const format = config.format === "json" ? "json" : "jsonl";
    /** @type {import("./migrationContracts").AuditRecord[]} */
    const buffer = [];
    let flushed = false;

    return {
        async append(records) {
            const { validateAuditRecord } = require("./migrationContracts");
            for (const record of records) {
                validateAuditRecord(record);
            }
            buffer.push(...records);
        },
        async flush() {
            if (buffer.length === 0) {
                return;
            }

            const directory = path.dirname(artifactPath);
            if (directory && directory !== ".") {
                fs.mkdirSync(directory, { recursive: true });
            } else {
                fs.mkdirSync(".", { recursive: true });
            }

            const serialized = buffer.map(serializeAuditRecord);

            if (format === "json") {
                /** @type {Record<string, unknown>[]} */
                let existing = [];
                if (flushed && fs.existsSync(artifactPath)) {
                    existing = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
                }
                fs.writeFileSync(
                    artifactPath,
                    JSON.stringify([...existing, ...serialized], null, 2),
                    "utf8"
                );
            } else {
                const lines = serialized.map((record) => JSON.stringify(record)).join("\n");
                if (flushed && fs.existsSync(artifactPath)) {
                    fs.appendFileSync(artifactPath, `\n${lines}\n`, "utf8");
                } else {
                    fs.writeFileSync(artifactPath, `${lines}\n`, "utf8");
                }
            }

            buffer.length = 0;
            flushed = true;
        },
        getArtifactPath() {
            return artifactPath;
        }
    };
}

module.exports = {
    createAuditWriter,
    createStubAuditWriter
};
