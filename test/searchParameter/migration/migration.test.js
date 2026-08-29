require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const { reloadRegistry } = require("@models/FHIR/searchParameter/registry/registryManager");
const { resolveLookupStatus } = require("@models/FHIR/searchParameter/registry/snapshot");
const { tryApplyRegistryParameter } = require("@models/FHIR/searchParameter/runtime/registrySearchHandler");
const productionResources = require("@models/FHIR/fhir.resourceList.json");
const {
    startRegistryTestContext,
    stopRegistryTestContext
} = require("../support/registry-test-context");

describe("SearchParameter migration", function () {
    it("treats disabled registry codes as unknown parameters", async function () {
        const snapshot = await reloadRegistry();
        const disabledKey = [...snapshot.disabledLookupKeys][0];
        if (!disabledKey) {
            this.skip();
        }
        const [resourceType, code] = disabledKey.split("::");
        expect(resolveLookupStatus(snapshot, resourceType, code)).to.equal("disabled");
    });

    it("returns disabled for unknown codes on production resources", async function () {
        const result = await tryApplyRegistryParameter({
            resourceType: "Account",
            query: { definitelyUnknownParam: "x" },
            parameterName: "definitelyUnknownParam"
        });
        expect(result).to.equal("disabled");
    });

    it("never falls back for disabled, unsupported, or conflict lookups", async function () {
        const snapshot = await reloadRegistry({ databaseResources: [] });
        const disabledKey = [...snapshot.disabledLookupKeys].find((key) =>
            productionResources.includes(key.split("::")[0])
        );
        expect(disabledKey).to.be.a("string");
        const [resourceType, code] = disabledKey.split("::");
        expect(resolveLookupStatus(snapshot, resourceType, code)).to.equal("disabled");
        const result = await tryApplyRegistryParameter({
            resourceType,
            query: { [code]: "x" },
            parameterName: code
        });
        expect(result).to.equal("disabled");
    });
});

describe("SearchParameter mongo integration", function () {
    before(async function () {
        this.timeout(120000);
        await startRegistryTestContext();
    });

    after(async function () {
        await stopRegistryTestContext();
    });

    it("reloads consistently when database is available", async function () {
        const first = await reloadRegistry();
        const second = await reloadRegistry();
        expect(second.version).to.be.greaterThan(first.version);
        expect(second.byLookupKey.size).to.equal(first.byLookupKey.size);
    });
});

describe("SearchParameter document fixture queries", function () {
    before(async function () {
        this.timeout(120000);
        await startRegistryTestContext();
    });

    after(async function () {
        await stopRegistryTestContext();
    });

    it("matches Patient address string search against stored documents", async function () {
        const collection = mongoose.connection.collection("Patient_projection_test");
        await collection.deleteMany({});
        await collection.insertMany([
            {
                resourceType: "Patient",
                address: [{ city: "PleasantVille", country: "USA" }]
            },
            {
                resourceType: "Patient",
                address: [{ city: "Elsewhere", country: "USA" }]
            }
        ]);

        const plan = {
            searchType: "string",
            extractionPaths: [{ path: "address", datatype: "Address" }],
            estimatedCost: 1,
            multipleOr: true
        };
        const { buildFilterForValue } = require("@models/FHIR/searchParameter/executor/queryValueParser");
        const filter = buildFilterForValue(plan, "PleasantVille", undefined, undefined);
        const matches = await collection.find(filter).toArray();
        expect(matches).to.have.length(1);
        expect(matches[0].address[0].city).to.equal("PleasantVille");
        await collection.drop().catch(() => undefined);
    });

    it("matches Patient deceasedDateTime choice search", async function () {
        const collection = mongoose.connection.collection("Patient_projection_test");
        await collection.deleteMany({});
        await collection.insertMany([
            {
                resourceType: "Patient",
                deceasedDateTime: "2020-01-15"
            },
            {
                resourceType: "Patient",
                deceasedBoolean: true
            }
        ]);

        const plan = {
            searchType: "date",
            extractionPaths: [{ path: "deceasedDateTime", datatype: "dateTime" }],
            estimatedCost: 1,
            multipleOr: true
        };
        const { buildFilterForValue } = require("@models/FHIR/searchParameter/executor/queryValueParser");
        const filter = buildFilterForValue(plan, "2020-01-15", undefined, undefined);
        const matches = await collection.find(filter).toArray();
        expect(matches).to.have.length(1);
        expect(matches[0]).to.have.property("deceasedDateTime");
        await collection.drop().catch(() => undefined);
    });

    it("matches Observation combo-code nested array search", async function () {
        const collection = mongoose.connection.collection("Observation_projection_test");
        await collection.deleteMany({});
        await collection.insertMany([
            {
                resourceType: "Observation",
                code: {
                    coding: [{ system: "http://loinc.org", code: "1234-5" }]
                }
            },
            {
                resourceType: "Observation",
                component: [
                    {
                        code: {
                            coding: [{ system: "http://loinc.org", code: "9999-1" }]
                        }
                    }
                ]
            },
            {
                resourceType: "Observation",
                code: {
                    coding: [{ system: "http://loinc.org", code: "0000-0" }]
                }
            }
        ]);

        const plan = {
            searchType: "token",
            extractionPaths: [
                { path: "code", datatype: "CodeableConcept" },
                { path: "component.code", datatype: "CodeableConcept" }
            ],
            estimatedCost: 2,
            multipleOr: true
        };
        const { buildFilterForValue } = require("@models/FHIR/searchParameter/executor/queryValueParser");
        const filter = buildFilterForValue(plan, "http://loinc.org|9999-1", undefined, undefined);
        const matches = await collection.find(filter).toArray();
        expect(matches).to.have.length(1);
        expect(matches[0].component[0].code.coding[0].code).to.equal("9999-1");
        await collection.drop().catch(() => undefined);
    });

    it("matches reference array correlation with target guard", async function () {
        const collection = mongoose.connection.collection("Account_projection_test");
        await collection.deleteMany({});
        await collection.insertMany([
            {
                resourceType: "Account",
                subject: [
                    { reference: "Patient/1", type: "Patient" },
                    { reference: "Practitioner/9", type: "Practitioner" }
                ]
            },
            {
                resourceType: "Account",
                subject: [{ reference: "Patient/2", type: "Practitioner" }]
            },
            {
                resourceType: "Account",
                subject: [{ reference: "Patient/3", type: "Patient" }]
            }
        ]);

        const plan = {
            searchType: "reference",
            extractionPaths: [
                { path: "subject", datatype: "Reference", referenceTargetType: "Patient" }
            ],
            estimatedCost: 1,
            multipleOr: true
        };
        const { buildFilterForValue } = require("@models/FHIR/searchParameter/executor/queryValueParser");
        const filter = buildFilterForValue(plan, "Patient/3", undefined, undefined);
        const matches = await collection.find(filter).toArray();
        expect(matches).to.have.length(1);
        expect(matches[0].subject[0].reference).to.equal("Patient/3");
        await collection.drop().catch(() => undefined);
    });
});
