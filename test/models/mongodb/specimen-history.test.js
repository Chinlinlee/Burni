require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const {
    normalizeResourceTemporals
} = require("@root/models/FHIR/temporal");

const connection = mongoose.createConnection();
require("@root/models/mongodb/model/Specimen")(connection);
const SpecimenHistory = require("@root/models/mongodb/model/Specimen_history")(connection);

describe("Specimen history serialization", function () {
    after(function () {
        return connection.close();
    });

    it("serializes the stored myCollection field as FHIR collection", function () {
        const history = new SpecimenHistory(
            normalizeResourceTemporals({
                resourceType: "Specimen",
                id: "specimen-history-test",
                myCollection: {
                    collector: {
                        reference: "Practitioner/test"
                    },
                    collectedDateTime: "2015-08-16T06:40:17Z"
                }
            })
        );

        const result = history.getFHIRBundleField();

        expect(result.collection).to.deep.equal({
            collector: {
                reference: "Practitioner/test"
            },
            collectedDateTime: "2015-08-16T06:40:17Z"
        });
        expect(result).to.not.have.property("myCollection");
    });
});
