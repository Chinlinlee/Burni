require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { ObjectId } = require("mongodb");
const { registerDiscoveredModels } = require("@models/mongodb/connector");
const {
    createDocumentTransformer
} = require("@models/FHIR/searchParameter/migration/documentTransformer");
const {
    validateTransformedDocument,
    validateTransformedBatch,
    MIGRATION_BATCH_VALIDATION_MISSING_ID,
    MIGRATION_BATCH_VALIDATION_NON_CANONICAL_TEMPORAL,
    MIGRATION_BATCH_VALIDATION_INVALID_TEMPORAL
} = require("@models/FHIR/searchParameter/migration/batchDocumentValidator");
const { createTargetBatchWriter } = require("@models/FHIR/searchParameter/migration/targetBatchWriter");

const DISCOVERED_MODELS = {
    resourceModels: ["Patient.js"],
    historyModels: [],
    staticModels: []
};

function baseRunIdentity(overrides = {}) {
    return {
        runId: "run-1",
        sourceDatabaseIdentity: "source-db",
        targetDatabaseIdentity: "target-db",
        ...overrides
    };
}

function patientSource(overrides = {}) {
    return {
        resource: "Patient",
        model: "Patient",
        kind: "resource",
        collectionName: "Patient",
        ...overrides
    };
}

function writeContext(overrides = {}) {
    return {
        runIdentity: baseRunIdentity(),
        source: patientSource(),
        batchId: "batch-1",
        ...overrides
    };
}

function transformContext(overrides = {}) {
    return {
        runIdentity: baseRunIdentity(),
        source: patientSource(),
        batchId: "batch-1",
        ...overrides
    };
}

function patientDocument(overrides = {}) {
    return {
        _id: "patient-1",
        id: "patient-1",
        resourceType: "Patient",
        active: true,
        birthDate: "1995-06",
        ...overrides
    };
}

describe("batch document validator", function () {
    /** @type {ReturnType<typeof createDocumentTransformer>} */
    let transformer;

    before(function () {
        transformer = createDocumentTransformer({
            runIdentity: baseRunIdentity()
        });
    });

    it("accepts a valid transformed document", function () {
        const sourceDoc = patientDocument();
        const { document } = transformer.transformDocument(sourceDoc, transformContext());
        const result = validateTransformedDocument(document, {
            source: patientSource(),
            sourceDocument: sourceDoc
        });

        expect(result.valid).to.equal(true);
        expect(result.errors).to.deep.equal([]);
    });

    it("accepts a valid transformed batch", function () {
        const sourceDocs = [patientDocument({ _id: "p-1", id: "p-1" })];
        const transformed = transformer.transformBatch(sourceDocs, transformContext());
        const result = validateTransformedBatch(
            transformed.map((entry) => entry.document),
            {
                ...writeContext(),
                sourceDocuments: sourceDocs
            }
        );

        expect(result.valid).to.equal(true);
        expect(result.errors).to.deep.equal([]);
    });

    it("fails when _id is missing", function () {
        const sourceDoc = patientDocument();
        const { document } = transformer.transformDocument(sourceDoc, transformContext());
        delete document._id;

        const result = validateTransformedDocument(document, {
            source: patientSource(),
            sourceDocument: sourceDoc
        });

        expect(result.valid).to.equal(false);
        expect(result.errors).to.deep.include({
            documentId: "patient-1",
            message: "Transformed document is missing _id",
            code: MIGRATION_BATCH_VALIDATION_MISSING_ID
        });
    });

    it("fails when a non-canonical temporal value remains", function () {
        const document = {
            _id: "patient-1",
            id: "patient-1",
            resourceType: "Patient",
            birthDate: "1995-06"
        };

        const result = validateTransformedDocument(document, {
            source: patientSource(),
            sourceDocument: document
        });

        expect(result.valid).to.equal(false);
        expect(result.errors.some((error) => error.code === MIGRATION_BATCH_VALIDATION_NON_CANONICAL_TEMPORAL)).to.equal(
            true
        );
        expect(result.errors.some((error) => error.path === "birthDate")).to.equal(true);
    });

    it("fails when a temporal value is invalid", function () {
        const document = {
            _id: "patient-1",
            id: "patient-1",
            resourceType: "Patient",
            birthDate: {
                value: "not-a-date",
                precision: "month",
                normalizedStart: "1995-06-01",
                normalizedEnd: "1995-07-01"
            }
        };

        const result = validateTransformedDocument(document, {
            source: patientSource(),
            sourceDocument: document
        });

        expect(result.valid).to.equal(false);
        expect(result.errors.some((error) => error.code === MIGRATION_BATCH_VALIDATION_INVALID_TEMPORAL)).to.equal(
            true
        );
        expect(result.errors.some((error) => error.path === "birthDate")).to.equal(true);
    });
});

describe("target batch writer validation gate", function () {
    /** @type {MongoMemoryServer | null} */
    let memoryServer = null;

    /** @type {import("mongoose").Connection | null} */
    let connection = null;

    /** @type {Record<string, import("mongoose").Model>} */
    let targetModels = {};

    before(async function () {
        memoryServer = await MongoMemoryServer.create();
        connection = mongoose.createConnection(memoryServer.getUri());
        await connection.asPromise();
        targetModels = {};
        registerDiscoveredModels(DISCOVERED_MODELS, targetModels, connection);
    });

    after(async function () {
        if (connection) {
            await connection.close();
            connection = null;
        }
        if (memoryServer) {
            await memoryServer.stop();
            memoryServer = null;
        }
    });

    beforeEach(async function () {
        await connection.db.dropDatabase();
    });

    it("rejects invalid batches without writing to the database", async function () {
        const writer = createTargetBatchWriter({
            targetConnection: connection,
            targetModels
        });
        const invalidDocuments = [
            {
                id: "patient-1",
                resourceType: "Patient",
                birthDate: "1995-06"
            }
        ];

        const result = await writer.writeBatch("Patient", invalidDocuments, writeContext());

        expect(result.status).to.equal("failed");
        expect(result.sourceCount).to.equal(1);
        expect(result.targetCount).to.equal(0);
        expect(result.errors.length).to.be.greaterThan(0);
        expect(result.errors.some((error) => error.code === MIGRATION_BATCH_VALIDATION_MISSING_ID)).to.equal(
            true
        );

        const count = await connection.db.collection("Patient").countDocuments();
        expect(count).to.equal(0);
    });

    it("writes valid transformed batches after validation passes", async function () {
        const transformer = createDocumentTransformer({
            runIdentity: baseRunIdentity()
        });
        const sourceDoc = patientDocument({ _id: new ObjectId() });
        const { document } = transformer.transformDocument(sourceDoc, transformContext());

        const writer = createTargetBatchWriter({
            targetConnection: connection,
            targetModels
        });
        const result = await writer.writeBatch("Patient", [document], {
            ...writeContext(),
            sourceDocuments: [sourceDoc]
        });

        expect(result.status).to.equal("completed");
        expect(result.targetCount).to.equal(1);

        const stored = await connection.db.collection("Patient").findOne({ _id: sourceDoc._id });
        expect(stored).to.exist;
        expect(stored.birthDate).to.have.property("precision", "month");
    });
});
