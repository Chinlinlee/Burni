const mongoose = require("mongoose");
const productionCatalog = require("../../fhir.resourceList.json");
const { toPlainCanonicalValue } = require("../../temporal");
const {
    CONVERSION_POLICY,
    convertLegacyTemporalValue
} = require("./temporalConversion");
const { createDocumentTransformer } = require("./documentTransformer");
const {
    buildCatalogSourceDescriptors,
    createSourceReader
} = require("./sourceReader");
const { loadDefinitions } = require("./temporalPreflight");
const { validateMigrationRunIdentity } = require("./migrationContracts");

const LOSSY_POLICIES = new Set([
    CONVERSION_POLICY.UTC_CALENDAR_DAY_LOSSY,
    CONVERSION_POLICY.UTC_ABSOLUTE_TIME_LOSSY
]);

/**
 * @param {string} code
 * @param {string} message
 * @param {Record<string, unknown>} [details]
 */
function diagnostic(code, message, details = {}) {
    return { code, message, ...details };
}

/**
 * @param {import("mongoose").Connection} connection
 * @returns {import("mongodb").Db}
 */
function requireNativeDb(connection) {
    const db = connection.db;
    if (!db || typeof db.collection !== "function") {
        throw new Error(
            "sourceTargetVerification requires a connected Mongoose connection with db.collection"
        );
    }
    return db;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function normalizeDocumentId(value) {
    if (value === undefined || value === null) {
        return String(value);
    }
    if (
        typeof value === "object" &&
        typeof /** @type {{ toString?: () => string }} */ (value).toString === "function"
    ) {
        return value.toString();
    }
    return String(value);
}

/**
 * @param {unknown} value
 * @param {WeakSet<object>} [visited]
 * @returns {unknown}
 */
function normalizeCompareValue(value, visited = new WeakSet()) {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (
        value instanceof mongoose.Types.Decimal128 ||
        (typeof value === "object" &&
            value !== null &&
            /** @type {{ _bsontype?: string }} */ (value)._bsontype === "Decimal128")
    ) {
        return value.toString();
    }
    if (
        typeof value === "object" &&
        value !== null &&
        /** @type {{ _bsontype?: string }} */ (value)._bsontype === "ObjectID"
    ) {
        return value.toString();
    }
    if (Array.isArray(value)) {
        return value.map((entry) => normalizeCompareValue(entry, visited));
    }
    if (typeof value === "object") {
        if (visited.has(value)) {
            return "[Circular]";
        }
        visited.add(value);

        const plain = toPlainCanonicalValue(value);
        const source =
            plain !== null && typeof plain === "object" && !Array.isArray(plain) ? plain : value;

        if (Array.isArray(source)) {
            return source.map((entry) => normalizeCompareValue(entry, visited));
        }

        return Object.fromEntries(
            Object.entries(/** @type {Record<string, unknown>} */ (source)).map(
                ([key, entry]) => [key, normalizeCompareValue(entry, visited)]
            )
        );
    }
    return value;
}

/**
 * @param {unknown} left
 * @param {unknown} right
 * @returns {boolean}
 */
function valuesEqual(left, right) {
    return (
        JSON.stringify(normalizeCompareValue(left)) ===
        JSON.stringify(normalizeCompareValue(right))
    );
}

/**
 * @param {unknown} document
 * @param {string[]} segments
 * @returns {unknown}
 */
function getValueAtPath(document, segments) {
    let current = document;
    for (const segment of segments) {
        if (current === undefined || current === null) {
            return undefined;
        }
        const arrayMatch = segment.match(/^(.+)\[(\d+)\]$/);
        if (arrayMatch) {
            const arrayValue = /** @type {Record<string, unknown>} */ (current)[arrayMatch[1]];
            current = Array.isArray(arrayValue) ? arrayValue[Number(arrayMatch[2])] : undefined;
            continue;
        }
        current = /** @type {Record<string, unknown>} */ (current)[segment];
    }
    return current;
}

/**
 * @param {string} path
 * @returns {string[]}
 */
function splitDocumentPath(path) {
    return path
        .replace(/\[(\d+)\]/g, ".$1")
        .split(".")
        .filter(Boolean);
}

/**
 * @param {unknown} expected
 * @param {unknown} actual
 * @param {string} [currentPath]
 * @returns {Array<{ path: string, expected: unknown, actual: unknown }>}
 */
function collectDocumentDiffs(expected, actual, currentPath = "") {
    if (valuesEqual(expected, actual)) {
        return [];
    }

    const expectedIsObject =
        expected !== null && typeof expected === "object" && !Array.isArray(expected);
    const actualIsObject =
        actual !== null && typeof actual === "object" && !Array.isArray(actual);

    if (Array.isArray(expected) && Array.isArray(actual)) {
        const maxLength = Math.max(expected.length, actual.length);
        /** @type {Array<{ path: string, expected: unknown, actual: unknown }>} */
        const diffs = [];
        for (let index = 0; index < maxLength; index += 1) {
            const childPath = currentPath ? `${currentPath}[${index}]` : `[${index}]`;
            diffs.push(...collectDocumentDiffs(expected[index], actual[index], childPath));
        }
        return diffs;
    }

    if (expectedIsObject && actualIsObject) {
        const keys = new Set([
            ...Object.keys(/** @type {Record<string, unknown>} */ (expected)),
            ...Object.keys(/** @type {Record<string, unknown>} */ (actual))
        ]);
        /** @type {Array<{ path: string, expected: unknown, actual: unknown }>} */
        const diffs = [];
        for (const key of keys) {
            const childPath = currentPath ? `${currentPath}.${key}` : key;
            diffs.push(
                ...collectDocumentDiffs(
                    /** @type {Record<string, unknown>} */ (expected)[key],
                    /** @type {Record<string, unknown>} */ (actual)[key],
                    childPath
                )
            );
        }
        return diffs;
    }

    return [
        {
            path: currentPath || "<root>",
            expected,
            actual
        }
    ];
}

/**
 * @param {{
 *   path: string,
 *   expected: unknown,
 *   actual: unknown
 * }} diff
 * @param {object} originalSource
 * @param {import("./migrationContracts").AuditRecord[]} auditEntries
 * @returns {boolean}
 */
function isExpectedLossyDifference(diff, originalSource, auditEntries) {
    const auditEntry = auditEntries.find((entry) => entry.fhirPath === diff.path);
    if (!auditEntry || !LOSSY_POLICIES.has(auditEntry.policy)) {
        return false;
    }

    const originalValue = getValueAtPath(originalSource, splitDocumentPath(diff.path));
    if (!(originalValue instanceof Date)) {
        return false;
    }

    const expectedGenerated = convertLegacyTemporalValue(
        originalValue,
        auditEntry.temporalType,
        diff.path
    );
    return valuesEqual(expectedGenerated, diff.actual);
}

/**
 * @param {import("mongodb").Db} db
 * @param {string} collectionName
 * @returns {Promise<number>}
 */
async function countCollectionDocuments(db, collectionName) {
    const collections = await db.listCollections({ name: collectionName }).toArray();
    if (collections.length === 0) {
        return 0;
    }
    return db.collection(collectionName).countDocuments({});
}

/**
 * @param {import("mongodb").Db} db
 * @param {string} collectionName
 * @returns {Promise<Set<string>>}
 */
async function loadIdentitySet(db, collectionName) {
    const collections = await db.listCollections({ name: collectionName }).toArray();
    if (collections.length === 0) {
        return new Set();
    }

    const ids = await db
        .collection(collectionName)
        .find({}, { projection: { _id: 1 } })
        .map((document) => normalizeDocumentId(document._id))
        .toArray();
    return new Set(ids);
}

/**
 * @param {object} input
 * @param {import("mongoose").Connection} input.sourceConnection
 * @param {import("mongoose").Connection} input.targetConnection
 * @param {string[]} [input.catalog]
 * @param {boolean} [input.includeHistory]
 * @param {Record<string, object>} [input.definitions]
 * @param {import("./migrationContracts").MigrationRunIdentity} input.runIdentity
 * @param {number} [input.maxDocumentDiffs]
 * @returns {Promise<{
 *   valid: boolean,
 *   diagnostics: Array<object>,
 *   summary: {
 *     collectionsCompared: number,
 *     documentsCompared: number,
 *     documentMismatches: number,
 *     countMismatches: number,
 *     identityMismatches: number,
 *     expectedLossyDifferences: number
 *   },
 *   collections: Array<object>
 * }>}
 */
async function verifySourceTargetMigration({
    sourceConnection,
    targetConnection,
    catalog = productionCatalog,
    includeHistory = true,
    definitions = loadDefinitions(),
    runIdentity,
    maxDocumentDiffs = 20
}) {
    validateMigrationRunIdentity(runIdentity);
    const sourceDb = requireNativeDb(sourceConnection);
    const targetDb = requireNativeDb(targetConnection);
    const transformer = createDocumentTransformer({ definitions });
    const sources = buildCatalogSourceDescriptors(catalog, includeHistory);
    /** @type {Array<object>} */
    const diagnostics = [];
    /** @type {Array<object>} */
    const collections = [];
    let documentsCompared = 0;
    let documentMismatches = 0;
    let countMismatches = 0;
    let identityMismatches = 0;
    let expectedLossyDifferences = 0;

    for (const source of sources) {
        const sourceCount = await countCollectionDocuments(sourceDb, source.collectionName);
        const targetCount = await countCollectionDocuments(targetDb, source.collectionName);
        const sourceIds = await loadIdentitySet(sourceDb, source.collectionName);
        const targetIds = await loadIdentitySet(targetDb, source.collectionName);
        /** @type {Array<object>} */
        const collectionDiagnostics = [];
        let collectionValid = true;

        if (sourceCount !== targetCount) {
            countMismatches += 1;
            collectionValid = false;
            collectionDiagnostics.push(
                diagnostic(
                    "source-target-count-mismatch",
                    "Source and target collection counts differ",
                    {
                        collection: source.collectionName,
                        sourceCount,
                        targetCount
                    }
                )
            );
        }

        const missingInTarget = [...sourceIds].filter((id) => !targetIds.has(id));
        const extraInTarget = [...targetIds].filter((id) => !sourceIds.has(id));
        if (missingInTarget.length > 0 || extraInTarget.length > 0) {
            identityMismatches += 1;
            collectionValid = false;
            collectionDiagnostics.push(
                diagnostic(
                    "source-target-identity-mismatch",
                    "Source and target document identity sets differ",
                    {
                        collection: source.collectionName,
                        missingInTarget: missingInTarget.slice(0, maxDocumentDiffs),
                        extraInTarget: extraInTarget.slice(0, maxDocumentDiffs)
                    }
                )
            );
        }

        if (sourceCount === 0) {
            collections.push({
                collection: source.collectionName,
                resource: source.resource,
                kind: source.kind,
                valid: collectionValid,
                sourceCount,
                targetCount,
                documentsCompared: 0,
                documentMismatches: 0,
                diagnostics: collectionDiagnostics
            });
            diagnostics.push(...collectionDiagnostics);
            continue;
        }

        const reader = createSourceReader({ sourceConnection, batchSize: 100 });
        let collectionDocumentsCompared = 0;
        let collectionDocumentMismatches = 0;

        try {
            /** @type {import("./migrationContracts").MigrationBatchBoundary | undefined} */
            let boundary;
            do {
                const batch = await reader.readBatch(source, boundary);
                if (batch.documents.length === 0) {
                    break;
                }

                for (const sourceDocument of batch.documents) {
                    collectionDocumentsCompared += 1;
                    documentsCompared += 1;
                    const documentId = sourceDocument._id ?? sourceDocument.id;
                    const targetDocument = await targetDb
                        .collection(source.collectionName)
                        .findOne({ _id: documentId });

                    if (!targetDocument) {
                        collectionDocumentMismatches += 1;
                        documentMismatches += 1;
                        collectionValid = false;
                        if (collectionDiagnostics.length < maxDocumentDiffs) {
                            collectionDiagnostics.push(
                                diagnostic(
                                    "source-target-document-missing",
                                    "Target document is missing for migrated source identity",
                                    {
                                        collection: source.collectionName,
                                        documentId: normalizeDocumentId(documentId)
                                    }
                                )
                            );
                        }
                        continue;
                    }

                    let transformed;
                    try {
                        transformed = transformer.transformDocument(sourceDocument, {
                            runIdentity,
                            source,
                            batchId:
                                batch.nextBoundary?.batchId ||
                                `${source.collectionName}:verify`
                        });
                    } catch (error) {
                        collectionDocumentMismatches += 1;
                        documentMismatches += 1;
                        collectionValid = false;
                        if (collectionDiagnostics.length < maxDocumentDiffs) {
                            collectionDiagnostics.push(
                                diagnostic(
                                    "source-target-transform-failed",
                                    "Failed to transform source document for comparison",
                                    {
                                        collection: source.collectionName,
                                        documentId: normalizeDocumentId(documentId),
                                        message:
                                            error instanceof Error ? error.message : String(error)
                                    }
                                )
                            );
                        }
                        continue;
                    }

                    const diffs = collectDocumentDiffs(
                        transformed.document,
                        targetDocument
                    ).filter((diff) => diff.path !== "_id");

                    if (diffs.length === 0) {
                        continue;
                    }

                    const unexpectedDiffs = diffs.filter(
                        (diff) =>
                            !isExpectedLossyDifference(
                                diff,
                                sourceDocument,
                                transformed.auditEntries
                            )
                    );
                    expectedLossyDifferences += diffs.length - unexpectedDiffs.length;

                    if (unexpectedDiffs.length > 0) {
                        collectionDocumentMismatches += 1;
                        documentMismatches += 1;
                        collectionValid = false;
                        if (collectionDiagnostics.length < maxDocumentDiffs) {
                            collectionDiagnostics.push(
                                diagnostic(
                                    "source-target-document-mismatch",
                                    "Transformed source document does not match target document",
                                    {
                                        collection: source.collectionName,
                                        documentId: normalizeDocumentId(documentId),
                                        differences: unexpectedDiffs.slice(0, 5)
                                    }
                                )
                            );
                        }
                    }
                }

                boundary = batch.nextBoundary ?? undefined;
            } while (boundary);
        } finally {
            await reader.close();
        }

        collections.push({
            collection: source.collectionName,
            resource: source.resource,
            kind: source.kind,
            valid: collectionValid,
            sourceCount,
            targetCount,
            documentsCompared: collectionDocumentsCompared,
            documentMismatches: collectionDocumentMismatches,
            diagnostics: collectionDiagnostics
        });
        diagnostics.push(...collectionDiagnostics);
    }

    return {
        valid: diagnostics.length === 0,
        diagnostics,
        summary: {
            collectionsCompared: collections.length,
            documentsCompared,
            documentMismatches,
            countMismatches,
            identityMismatches,
            expectedLossyDifferences
        },
        collections
    };
}

module.exports = {
    normalizeCompareValue,
    collectDocumentDiffs,
    isExpectedLossyDifference,
    verifySourceTargetMigration
};
