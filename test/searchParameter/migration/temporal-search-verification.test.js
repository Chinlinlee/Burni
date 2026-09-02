require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const {
    buildRepresentativeScenarios,
    verifyTemporalSearchHitSets
} = require("@models/FHIR/searchParameter/migration/temporalSearchVerification");

/** @type {MongoMemoryServer | null} */
let memoryServer = null;

/** @type {import("mongoose").Connection | null} */
let targetConnection = null;

describe("temporal search verification", function () {
    before(async function () {
        memoryServer = await MongoMemoryServer.create();
        const baseUri = memoryServer.getUri().replace(/\/?$/, "");
        targetConnection = mongoose.createConnection(`${baseUri}/temporal-search-verify`);
        await targetConnection.asPromise();
    });

    after(async function () {
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
        await targetConnection.db.dropDatabase();
    });

    it("defines representative scenarios for precision, comparator, Period, array, choice, history, and contained coverage", function () {
        const scenarios = buildRepresentativeScenarios();
        const scenarioIds = scenarios.map((scenario) => scenario.id);

        expect(scenarioIds).to.include.members([
            "date-precision",
            "datetime-precision",
            "instant-precision",
            "period-comparator",
            "date-comparator-lt",
            "array-correlation",
            "choice-branches",
            "contained-temporal",
            "history-temporal"
        ]);
    });

    it("passes representative temporal search hit-set acceptance on target connection", async function () {
        const result = await verifyTemporalSearchHitSets({
            targetConnection
        });

        expect(result.valid).to.equal(true);
        expect(result.summary.passedScenarios).to.equal(result.summary.scenarioCount);
        expect(result.summary.failedScenarios).to.equal(0);
    });

    it("fails when a scenario returns an unexpected hit-set", async function () {
        const scenarios = buildRepresentativeScenarios().filter(
            (scenario) => scenario.id === "date-precision"
        );
        scenarios[0].expectedHits = ["canonical-miss"];

        const result = await verifyTemporalSearchHitSets({
            targetConnection,
            scenarios
        });

        expect(result.valid).to.equal(false);
        expect(result.diagnostics.map((entry) => entry.code)).to.include(
            "temporal-search-hit-set-mismatch"
        );
    });
});
