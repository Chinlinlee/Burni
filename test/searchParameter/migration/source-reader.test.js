require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { ObjectId } = require("mongodb");
const {
    createSourceReader,
    createCatalogSourceIterator,
    DEFAULT_BATCH_SIZE
} = require("@models/FHIR/searchParameter/migration/sourceReader");

/** @type {MongoMemoryServer | null} */
let memoryServer = null;

/** @type {import("mongoose").Connection | null} */
let connection = null;

function patientSource(overrides = {}) {
    return {
        resource: "Patient",
        model: "Patient",
        kind: "resource",
        collectionName: "Patient",
        ...overrides
    };
}

async function insertPatientDocuments(count, birthDateFactory = () => new Date("2020-01-15T12:30:00.000Z")) {
    const collection = connection.db.collection("Patient");
    const documents = [];
    for (let index = 0; index < count; index += 1) {
        documents.push({
            _id: new ObjectId(),
            seq: index,
            resourceType: "Patient",
            birthDate: birthDateFactory(index)
        });
    }
    await collection.insertMany(documents);
    return documents;
}

describe("source reader", function () {
    before(async function () {
        memoryServer = await MongoMemoryServer.create();
        connection = mongoose.createConnection(memoryServer.getUri());
        await connection.asPromise();
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

    it("exports DEFAULT_BATCH_SIZE as 100", function () {
        expect(DEFAULT_BATCH_SIZE).to.equal(100);
    });

    it("reads documents in bounded batches without loading all at once", async function () {
        const inserted = await insertPatientDocuments(250);
        const reader = createSourceReader({
            sourceConnection: connection,
            batchSize: 100
        });

        const batches = [];
        let boundary;
        do {
            const result = await reader.readBatch(patientSource(), boundary);
            batches.push(result.documents);
            boundary = result.nextBoundary ?? undefined;
        } while (boundary);

        await reader.close();

        expect(batches).to.have.length(3);
        expect(batches[0]).to.have.length(100);
        expect(batches[1]).to.have.length(100);
        expect(batches[2]).to.have.length(50);

        const seenIds = new Set(
            batches.flatMap((batch) => batch.map((document) => String(document._id)))
        );
        expect(seenIds.size).to.equal(250);
        for (const document of inserted) {
            expect(seenIds.has(String(document._id))).to.equal(true);
        }
    });

    it("resumes from boundary and continues correctly", async function () {
        const inserted = await insertPatientDocuments(175);
        const reader = createSourceReader({
            sourceConnection: connection,
            batchSize: 100
        });

        const first = await reader.readBatch(patientSource());
        expect(first.documents).to.have.length(100);
        expect(first.nextBoundary).to.not.equal(null);

        const resumed = await reader.readBatch(patientSource(), first.nextBoundary);
        expect(resumed.documents).to.have.length(75);
        expect(resumed.nextBoundary).to.equal(null);

        const allIds = [
            ...first.documents.map((document) => String(document._id)),
            ...resumed.documents.map((document) => String(document._id))
        ];
        expect(allIds).to.have.length(175);
        expect(new Set(allIds).size).to.equal(175);
        for (const document of inserted) {
            expect(allIds.includes(String(document._id))).to.equal(true);
        }

        await reader.close();
    });

    it("catalog iterator covers resource and history collections", async function () {
        const catalog = ["Patient", "Observation"];
        const patientBirthDate = new Date("2019-05-10T08:00:00.000Z");
        const historyEffective = new Date("2021-03-01T16:45:00.000Z");
        const observationEffective = new Date("2022-07-04T00:00:00.000Z");

        await connection.db.collection("Patient").insertOne({
            _id: new ObjectId(),
            resourceType: "Patient",
            birthDate: patientBirthDate
        });
        await connection.db.collection("Patient_history").insertOne({
            _id: new ObjectId(),
            resourceType: "Patient",
            effectiveDateTime: historyEffective
        });
        await connection.db.collection("Observation").insertOne({
            _id: new ObjectId(),
            resourceType: "Observation",
            effectiveDateTime: observationEffective
        });

        const iterator = createCatalogSourceIterator({
            sourceConnection: connection,
            catalog,
            includeHistory: true,
            batchSize: 10
        });

        /** @type {Array<{ source: { collectionName: string, kind: string }, count: number }>} */
        const batches = [];
        for await (const batch of iterator) {
            batches.push({
                source: {
                    collectionName: batch.source.collectionName,
                    kind: batch.source.kind
                },
                count: batch.documents.length
            });
        }

        expect(batches).to.deep.equal([
            { source: { collectionName: "Patient", kind: "resource" }, count: 1 },
            { source: { collectionName: "Patient_history", kind: "history" }, count: 1 },
            { source: { collectionName: "Observation", kind: "resource" }, count: 1 }
        ]);
    });

    it("preserves BSON Date values from raw cursor reads", async function () {
        const birthDate = new Date("2020-01-15T12:30:00.000Z");
        await connection.db.collection("Patient").insertOne({
            _id: new ObjectId(),
            resourceType: "Patient",
            birthDate
        });

        const reader = createSourceReader({ sourceConnection: connection, batchSize: 10 });
        const result = await reader.readBatch(patientSource());
        await reader.close();

        expect(result.documents).to.have.length(1);
        expect(result.documents[0].birthDate).to.be.instanceOf(Date);
        expect(result.documents[0].birthDate.getTime()).to.equal(birthDate.getTime());
        expect(result.documents[0].birthDate).to.not.equal(birthDate);
    });

    it("skips missing or empty catalog collections gracefully", async function () {
        await connection.db.collection("Patient").insertOne({
            _id: new ObjectId(),
            resourceType: "Patient"
        });

        const iterator = createCatalogSourceIterator({
            sourceConnection: connection,
            catalog: ["Patient", "Observation"],
            includeHistory: true,
            batchSize: 10
        });

        const seenCollections = [];
        for await (const batch of iterator) {
            seenCollections.push(batch.source.collectionName);
        }

        expect(seenCollections).to.deep.equal(["Patient"]);
    });
});
