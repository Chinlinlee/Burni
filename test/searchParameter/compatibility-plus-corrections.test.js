require("module-alias/register");

const { expect } = require("chai");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { reloadRegistry } = require("@models/FHIR/searchParameter/registry/registryManager");
const { getEffectiveDefinition } = require("@models/FHIR/searchParameter/registry/snapshot");
const { KNOWN_HIT_SETS, getKnownHitSet } = require("@models/FHIR/searchParameter/migration/hitSets");
const { prepareMainDocumentForHitSet } = require("@models/FHIR/searchParameter/migration/hitSetDocuments");
const {
    getEnablementGates,
    getCompatibilityNonGoals,
    getExpectedLegacyDivergenceKeys,
    usesLegacyFilterEqualityAsEnablementGate
} = require("@models/FHIR/searchParameter/migration/compatibilityPolicy");
const { executeSearchQueryPlan } = require("@models/FHIR/searchParameter/executor/mongoExecutor");
const {
    startMongoMemoryTestContext,
    stopMongoMemoryTestContext
} = require("./mongoMemoryHelper");

const ARCHIVE_ROOT = path.join(
    __dirname,
    "../../models/FHIR/searchParameter/fixtures/archive"
);

/**
 * @param {Object} fixture
 * @returns {Object}
 */
function buildMainPatientFixture(fixture) {
    const resource = JSON.parse(JSON.stringify(fixture));
    delete resource.id;
    resource.generalPractitioner = [{ reference: "Practitioner/gp-example" }];
    resource.link = [{ other: { reference: "Patient/link-target" }, type: "seealso" }];
    resource.telecom = [
        { system: "phone", value: "+31612345678", use: "mobile" },
        { system: "phone", value: "+31201234567", use: "home" },
        { system: "email", value: "roel.bor@example.org", use: "home" }
    ];
    return resource;
}

function buildCompanionPatientFixture() {
    return {
        resourceType: "Patient",
        active: false,
        gender: "female",
        birthDate: "1985-06-01",
        deceasedDateTime: new Date("2020-01-15T12:00:00.000Z"),
        name: [{ family: "Companion", given: ["Alex"], text: "Alex Companion" }],
        address: [
            {
                city: "Rotterdam",
                country: "USA",
                postalCode: "3011AA",
                state: "ZH",
                use: "work",
                text: "Rotterdam office"
            }
        ],
        identifier: [{ system: "urn:oid:example", value: "999999999" }],
        telecom: [{ system: "phone", value: "+31000000000", use: "mobile" }]
    };
}

/**
 * @param {string} collectionName
 * @param {Object} filter
 * @returns {Promise<Object[]>}
 */
async function queryCollection(collectionName, filter) {
    const collection = mongoose.connection.collection(collectionName);
    return collection.find(filter).toArray();
}

describe("SearchParameter compatibility-plus-corrections", function () {
    describe("policy", function () {
        it("documents enablement gates without legacy filter equality", function () {
            expect(usesLegacyFilterEqualityAsEnablementGate()).to.equal(false);
            expect(getEnablementGates()).to.deep.equal([
                "golden-filter",
                "document-hit-set",
                "operator-multiplicity",
                "diagnostics",
                "structural-registry"
            ]);
            expect(getEnablementGates()).to.not.include("legacy-filter-equality");
            expect(getEnablementGates()).to.not.include("shadow-comparison");
        });

        it("documents compatibility non-goals", function () {
            expect(getCompatibilityNonGoals()).to.include("Address.text string projection");
            expect(getCompatibilityNonGoals()).to.include("full R4 phonetic matching");
        });

        it("documents every expected Patient and Observation legacy divergence", function () {
            expect(getExpectedLegacyDivergenceKeys()).to.have.members([
                "Patient::deceased",
                "Patient::email",
                "Patient::phone",
                "Patient::identifier",
                "Patient::telecom",
                "Patient::phonetic",
                "Patient::name",
                "Observation::value-quantity"
            ]);
        });
    });

    describe("registry corrections in Mongo", function () {
        before(async function () {
            this.timeout(120000);
            await startMongoMemoryTestContext();
        });

        after(async function () {
            await stopMongoMemoryTestContext();
        });

        it("matches deceasedDateTime for deceased=true across choice branches", async function () {
            const snapshot = await reloadRegistry();
            const plan = getEffectiveDefinition(snapshot, "Patient", "deceased").compiledPlan;
            const registry = executeSearchQueryPlan(plan, "true", "deceased");

            expect(JSON.stringify(registry)).to.include("deceasedDateTime");

            const collection = mongoose.connection.collection("Patient_compat_deceased");
            await collection.drop().catch(() => undefined);
            await collection.insertMany([
                {
                    resourceType: "Patient",
                    deceasedDateTime: new Date("2019-05-01T12:00:00.000Z"),
                    _fixtureRole: "dateTime-only"
                },
                {
                    resourceType: "Patient",
                    deceasedBoolean: true,
                    _fixtureRole: "boolean"
                }
            ]);

            const registryMatches = await queryCollection("Patient_compat_deceased", registry);

            expect(registryMatches.map((entry) => entry._fixtureRole).sort()).to.deep.equal([
                "boolean",
                "dateTime-only"
            ]);
        });

        it("requires email system=value correlation and rejects phone-only telecom values", async function () {
            const snapshot = await reloadRegistry();
            const plan = getEffectiveDefinition(snapshot, "Patient", "email").compiledPlan;
            const registry = executeSearchQueryPlan(plan, "shared@example.org", "email");

            const collection = mongoose.connection.collection("Patient_compat_email");
            await collection.drop().catch(() => undefined);
            await collection.insertMany([
                {
                    resourceType: "Patient",
                    telecom: [{ system: "email", value: "shared@example.org" }],
                    _fixtureRole: "email-hit"
                },
                {
                    resourceType: "Patient",
                    telecom: [{ system: "phone", value: "shared@example.org" }],
                    _fixtureRole: "phone-only-miss"
                }
            ]);

            const registryMatches = await queryCollection("Patient_compat_email", registry);

            expect(registryMatches.map((entry) => entry._fixtureRole)).to.deep.equal(["email-hit"]);
        });

        it("omits incompatible SampledData from value-quantity registry filters", async function () {
            const snapshot = await reloadRegistry();
            const plan = getEffectiveDefinition(snapshot, "Observation", "value-quantity").compiledPlan;
            const registry = executeSearchQueryPlan(plan, "eq10|kg", "value-quantity");

            expect(JSON.stringify(registry)).to.not.include("valueSampledData");
            expect(registry).to.deep.equal({
                $and: [{ "valueQuantity.system": "kg" }, { "valueQuantity.value": { $eq: 10 } }]
            });
        });

        it("accepts deceased=true correction in document hit-sets without legacy filter equality", async function () {
            const snapshot = await reloadRegistry();
            const plan = getEffectiveDefinition(snapshot, "Patient", "deceased").compiledPlan;
            const collection = mongoose.connection.collection("Patient_compat_hit_set");
            await collection.drop().catch(() => undefined);
            await collection.insertMany([
                {
                    resourceType: "Patient",
                    deceasedDateTime: new Date("2019-05-01T12:00:00.000Z"),
                    _fixtureRole: "dateTime-only"
                }
            ]);

            const matches = await queryCollection(
                "Patient_compat_hit_set",
                executeSearchQueryPlan(plan, "true", "deceased")
            );
            expect(matches.map((entry) => entry._fixtureRole)).to.deep.equal(["dateTime-only"]);
        });
    });

    describe("public search hit-set gate", function () {
        before(async function () {
            this.timeout(120000);
            await startMongoMemoryTestContext();
        });

        after(async function () {
            await stopMongoMemoryTestContext();
        });

        it("verifies Patient public search cases through document hit-sets instead of legacy filters", async function () {
            const snapshot = await reloadRegistry();
            const mainDocument = buildMainPatientFixture(
                JSON.parse(fs.readFileSync(path.join(ARCHIVE_ROOT, "derived", "Patient.json"), "utf8"))
            );
            const companionDocument = buildCompanionPatientFixture();
            const collection = mongoose.connection.collection("Patient_compat_public_hit_set");
            await collection.drop().catch(() => undefined);
            await collection.insertMany([
                { ...mainDocument, _fixtureRole: "main" },
                { ...companionDocument, _fixtureRole: "companion" }
            ]);

            const failures = [];
            for (const searchCase of KNOWN_HIT_SETS.Patient) {
                const definition = getEffectiveDefinition(snapshot, "Patient", searchCase.code);
                const hitSet = getKnownHitSet("Patient", searchCase.code);
                const plan = definition?.compiledPlan;
                if (!plan || !hitSet) {
                    failures.push(`${searchCase.code}: missing plan or hit-set`);
                    continue;
                }

                const preparedMain = prepareMainDocumentForHitSet(mainDocument, hitSet, plan);
                await collection.deleteMany({});
                await collection.insertMany([
                    { ...preparedMain, _fixtureRole: "main" },
                    { ...companionDocument, _fixtureRole: "companion" }
                ]);

                const parameterName = Object.keys(searchCase.query)[0];
                const rawValue = searchCase.query[parameterName];
                const filter = executeSearchQueryPlan(plan, rawValue, parameterName);
                const matches = await queryCollection("Patient_compat_public_hit_set", filter);
                const mainMatches = matches.some((entry) => entry._fixtureRole === "main");
                const companionMatches = matches.some((entry) => entry._fixtureRole === "companion");

                if (searchCase.expectHit === "main" && !mainMatches) {
                    failures.push(`${searchCase.code}: expected main fixture hit`);
                }
                if (searchCase.expectHit === "companion" && !companionMatches) {
                    failures.push(`${searchCase.code}: expected companion fixture hit`);
                }
                if (searchCase.expectHit === "none" && matches.length > 0) {
                    failures.push(`${searchCase.code}: expected no hits`);
                }
            }

            expect(failures, failures.join("\n")).to.deep.equal([]);
        });
    });
});
