const { expect } = require("chai");
const mongoose = require("mongoose");
const {
    registerDiscoveredModels
} = require("../../../models/mongodb/connector");

const DISCOVERED_MODELS = {
    resourceModels: ["Patient.js"],
    historyModels: ["Patient_history.js"],
    staticModels: ["FHIRStoredID.js", "referenceBy.js"]
};

describe("connection-aware model registration", function () {
    it("registers resource, history, and static models on the supplied connection", async function () {
        const firstConnection = mongoose.createConnection();
        const secondConnection = mongoose.createConnection();
        const globalModelsBefore = Object.keys(mongoose.models).sort();

        try {
            const firstModels = {};
            const secondModels = {};
            registerDiscoveredModels(
                DISCOVERED_MODELS,
                firstModels,
                firstConnection
            );
            registerDiscoveredModels(
                DISCOVERED_MODELS,
                secondModels,
                secondConnection
            );

            expect(firstModels.Patient.db).to.equal(firstConnection);
            expect(firstModels.Patient_history.db).to.equal(firstConnection);
            expect(firstModels.FHIRStoredID.db).to.equal(firstConnection);
            expect(firstModels.referenceBy.db).to.equal(firstConnection);
            expect(secondModels.Patient.db).to.equal(secondConnection);
            expect(secondModels.Patient_history.db).to.equal(secondConnection);
            expect(secondModels.FHIRStoredID.db).to.equal(secondConnection);
            expect(secondModels.referenceBy.db).to.equal(secondConnection);
            expect(Object.keys(mongoose.models).sort()).to.deep.equal(
                globalModelsBefore
            );
        } finally {
            await Promise.all([
                firstConnection.destroy(),
                secondConnection.destroy()
            ]);
        }
    });
});
