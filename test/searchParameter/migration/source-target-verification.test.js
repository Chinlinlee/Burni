require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { ObjectId } = require("mongodb");
const { registerDiscoveredModels } = require("@models/mongodb/connector");
const { runDualDatabaseMigrationBatchLoop } = require("@models/FHIR/searchParameter/migration/dualDatabaseOperator");
const { buildMigrationRunIdentity } = require("@models/FHIR/searchParameter/migration/dualDatabaseOperator");
const { verifySourceTargetMigration } = require("@models/FHIR/searchParameter/migration/sourceTargetVerification");
const { normalizeDate } = require("@models/FHIR/temporal");

/** @type {MongoMemoryServer | null} */
let memoryServer = null;

/** @type {import("mongoose").Connection | null} */
let sourceConnection = null;

/** @type {import("mongoose").Connection | null} */
let targetConnection = null;

/** @type {Record<string, import("mongoose").Model>} */
let targetModels = {};

function runIdentity() {
    return buildMigrationRunIdentity({
        runId: "source-target-verify-run",
        sourceDatabaseIdentity: "localhost/source-target-verify",
        targetDatabaseIdentity: "localhost/target-target-verify"
    });
}

async function migratePatientCatalog() {
    return runDualDatabaseMigrationBatchLoop({
        sourceConnection,
        targetConnection,
        targetModels,
        catalog: ["Patient"],
        includeHistory: false,
        batchSize: 10,
        runIdentity: runIdentity()
    });
}

describe("source/target migration verification", function () {
    before(async function () {
        memoryServer = await MongoMemoryServer.create();
        const baseUri = memoryServer.getUri().replace(/\/?$/, "");
        sourceConnection = mongoose.createConnection(`${baseUri}/source-target-verify`);
        targetConnection = mongoose.createConnection(`${baseUri}/target-target-verify`);
        await Promise.all([sourceConnection.asPromise(), targetConnection.asPromise()]);
        targetModels = {};
        registerDiscoveredModels(
            { resourceModels: ["Patient.js"], historyModels: [], staticModels: [] },
            targetModels,
            targetConnection
        );
    });

    after(async function () {
        if (sourceConnection) {
            await sourceConnection.close();
            sourceConnection = null;
        }
        if (targetConnection) {
            await targetConnection.close();
            targetConnection = null;
        }
        if (memoryServer) {
            await memoryServer.stop();
            memoryServer = null;
        }
    });

    beforeEach(async function () {
        await sourceConnection.db.dropDatabase();
        await targetConnection.db.dropDatabase();
    });

    it("fails when collection counts differ", async function () {
        await sourceConnection.db.collection("Patient").insertOne({
            _id: new ObjectId(),
            id: "patient-1",
            resourceType: "Patient",
            birthDate: "1990-01-01"
        });

        const result = await verifySourceTargetMigration({
            sourceConnection,
            targetConnection,
            catalog: ["Patient"],
            includeHistory: false,
            runIdentity: runIdentity()
        });

        expect(result.valid).to.equal(false);
        expect(result.summary.countMismatches).to.equal(1);
        expect(result.diagnostics.map((entry) => entry.code)).to.include(
            "source-target-count-mismatch"
        );
    });

    it("fails when document identity sets differ", async function () {
        const sourceId = new ObjectId();
        await sourceConnection.db.collection("Patient").insertOne({
            _id: sourceId,
            id: "patient-1",
            resourceType: "Patient",
            birthDate: "1990-01-01"
        });
        await targetConnection.db.collection("Patient").insertOne({
            _id: new ObjectId(),
            id: "patient-2",
            resourceType: "Patient",
            birthDate: normalizeDate("1991-01-01")
        });

        const result = await verifySourceTargetMigration({
            sourceConnection,
            targetConnection,
            catalog: ["Patient"],
            includeHistory: false,
            runIdentity: runIdentity()
        });

        expect(result.valid).to.equal(false);
        expect(result.summary.identityMismatches).to.equal(1);
        expect(result.diagnostics.map((entry) => entry.code)).to.include(
            "source-target-identity-mismatch"
        );
    });

    it("passes when migrated documents match transformed source values", async function () {
        await sourceConnection.db.collection("Patient").insertMany([
            {
                _id: new ObjectId(),
                id: "patient-1",
                resourceType: "Patient",
                birthDate: "1995-06-15"
            },
            {
                _id: new ObjectId(),
                id: "patient-2",
                resourceType: "Patient",
                birthDate: "1995-06"
            }
        ]);

        await migratePatientCatalog();

        const result = await verifySourceTargetMigration({
            sourceConnection,
            targetConnection,
            catalog: ["Patient"],
            includeHistory: false,
            runIdentity: runIdentity()
        });

        expect(result.valid).to.equal(true);
        expect(result.summary.documentsCompared).to.equal(2);
        expect(result.summary.documentMismatches).to.equal(0);
    });

    it("passes for BSON Date lossy source values against canonical target documents", async function () {
        const documentId = new ObjectId();
        await sourceConnection.db.collection("Patient").insertOne({
            _id: documentId,
            id: "patient-lossy",
            resourceType: "Patient",
            birthDate: new Date("2020-01-01T00:00:00.000Z"),
            deceasedDateTime: new Date("2021-06-15T12:00:00.000Z")
        });

        await migratePatientCatalog();

        const result = await verifySourceTargetMigration({
            sourceConnection,
            targetConnection,
            catalog: ["Patient"],
            includeHistory: false,
            runIdentity: runIdentity()
        });

        expect(result.valid).to.equal(true);
        expect(result.summary.documentsCompared).to.equal(1);
    });

    it("fails when a non-temporal field differs between source and target", async function () {
        const documentId = new ObjectId();
        await sourceConnection.db.collection("Patient").insertOne({
            _id: documentId,
            id: "patient-mismatch",
            resourceType: "Patient",
            birthDate: "1990-01-01",
            gender: "male"
        });

        await migratePatientCatalog();
        await targetConnection.db
            .collection("Patient")
            .updateOne({ _id: documentId }, { $set: { gender: "female" } });

        const result = await verifySourceTargetMigration({
            sourceConnection,
            targetConnection,
            catalog: ["Patient"],
            includeHistory: false,
            runIdentity: runIdentity()
        });

        expect(result.valid).to.equal(false);
        expect(result.summary.documentMismatches).to.equal(1);
        expect(result.diagnostics.map((entry) => entry.code)).to.include(
            "source-target-document-mismatch"
        );
    });
});
