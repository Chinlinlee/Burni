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
    getExpectedShadowMismatchKeys,
    isExpectedShadowMismatch,
    usesLegacyFilterEqualityAsEnablementGate
} = require("@models/FHIR/searchParameter/migration/compatibilityPolicy");
const { buildLegacyFilter } = require("@models/FHIR/searchParameter/runtime/legacyQueryBuilder");
const { compareWithLegacyHandler } = require("@models/FHIR/searchParameter/runtime/shadowComparison");
const {
    resetShadowDiagnostics,
    getAllSummaries,
    getResourceSummary
} = require("@models/FHIR/searchParameter/runtime/shadowDiagnostics");
const { areFiltersEqual } = require("@models/FHIR/searchParameter/runtime/queryComparator");
const { executeSearchQueryPlan } = require("@models/FHIR/searchParameter/executor/mongoExecutor");
const patientHandler = require("@root/api/FHIR/Patient/PatientParametersHandler");
const observationHandler = require("@root/api/FHIR/Observation/ObservationParametersHandler");
const {
    startMongoMemoryTestContext,
    stopMongoMemoryTestContext
} = require("./mongoMemoryHelper");

const ARCHIVE_ROOT = path.join(
    __dirname,
    "../../models/FHIR/searchParameter/fixtures/archive"
);

/** @type {Record<string, string>} */
const PATIENT_SHADOW_SAMPLES = {
    deceased: "true",
    email: "roel.bor@example.org",
    phone: "+31612345678",
    identifier: "urn:oid:2.16.840.1.113883.2.4.6.3|123456789",
    name: "Roel",
    telecom: "+31612345678",
    phonetic: "Bor"
};

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

        it("tracks every expected Patient and Observation shadow mismatch", function () {
            expect(getExpectedShadowMismatchKeys()).to.have.members([
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

    describe("shadow diagnostics", function () {
        beforeEach(function () {
            resetShadowDiagnostics();
        });

        it("never marks shadow summaries as ready for enablement", async function () {
            const snapshot = await reloadRegistry();
            const definition = snapshot.byLookupKey.get("Patient::gender");
            await compareWithLegacyHandler({
                resourceType: "Patient",
                parameterName: "gender",
                queryValue: "male",
                paramsSearch: patientHandler.paramsSearch,
                plan: definition.compiledPlan,
                source: "batch"
            });

            const summary = getAllSummaries()[0];
            expect(summary.readyForEnablement).to.equal(false);
            expect(summary.shadowDiagnosticOnly).to.equal(true);
        });

        it("classifies every Patient shadow mismatch as an expected correction or divergence", async function () {
            const snapshot = await reloadRegistry();
            for (const [code, sampleValue] of Object.entries(PATIENT_SHADOW_SAMPLES)) {
                const definition = snapshot.byLookupKey.get(`Patient::${code}`);
                await compareWithLegacyHandler({
                    resourceType: "Patient",
                    parameterName: code,
                    queryValue: sampleValue,
                    paramsSearch: patientHandler.paramsSearch,
                    plan: definition.compiledPlan,
                    source: "batch"
                });
            }

            const summary = getResourceSummary("Patient");
            const mismatches = summary.entries.filter((entry) => entry.status === "mismatch");
            expect(mismatches.map((entry) => `Patient::${entry.parameterName}`).sort()).to.deep.equal(
                getExpectedShadowMismatchKeys()
                    .filter((key) => key.startsWith("Patient::"))
                    .sort()
            );

            for (const entry of mismatches) {
                expect(
                    isExpectedShadowMismatch(`Patient::${entry.parameterName}`),
                    `${entry.parameterName} mismatch should be documented`
                ).to.equal(true);
            }
        });

        it("records Observation value-quantity mismatch without blocking enablement", async function () {
            const snapshot = await reloadRegistry();
            const definition = snapshot.byLookupKey.get("Observation::value-quantity");
            const entry = await compareWithLegacyHandler({
                resourceType: "Observation",
                parameterName: "value-quantity",
                queryValue: "eq10|kg",
                paramsSearch: observationHandler.paramsSearch,
                plan: definition.compiledPlan,
                source: "batch"
            });

            expect(entry.status).to.equal("mismatch");
            expect(isExpectedShadowMismatch("Observation::value-quantity")).to.equal(true);
            expect(getAllSummaries()[0].readyForEnablement).to.equal(false);
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

        it("matches deceasedDateTime for deceased=true while legacy only checks deceasedBoolean", async function () {
            const snapshot = await reloadRegistry();
            const plan = getEffectiveDefinition(snapshot, "Patient", "deceased").compiledPlan;
            const legacy = buildLegacyFilter(patientHandler.paramsSearch, "deceased", "true");
            const registry = executeSearchQueryPlan(plan, "true", "deceased");

            expect(areFiltersEqual(legacy.ok ? legacy.filter : null, registry)).to.equal(false);
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
            const legacyMatches = await queryCollection(
                "Patient_compat_deceased",
                legacy.ok ? legacy.filter : {}
            );

            expect(registryMatches.map((entry) => entry._fixtureRole).sort()).to.deep.equal([
                "boolean",
                "dateTime-only"
            ]);
            expect(legacyMatches.map((entry) => entry._fixtureRole)).to.deep.equal(["boolean"]);
        });

        it("requires email system=value correlation and rejects phone-only telecom values", async function () {
            const snapshot = await reloadRegistry();
            const plan = getEffectiveDefinition(snapshot, "Patient", "email").compiledPlan;
            const registry = executeSearchQueryPlan(plan, "shared@example.org", "email");
            const legacy = buildLegacyFilter(
                patientHandler.paramsSearch,
                "email",
                "shared@example.org"
            );

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
            const legacyMatches = await queryCollection(
                "Patient_compat_email",
                legacy.ok ? legacy.filter : {}
            );

            expect(registryMatches.map((entry) => entry._fixtureRole)).to.deep.equal(["email-hit"]);
            expect(legacyMatches.map((entry) => entry._fixtureRole).sort()).to.deep.equal([
                "email-hit",
                "phone-only-miss"
            ]);
        });

        it("omits incompatible SampledData from value-quantity registry filters", async function () {
            const snapshot = await reloadRegistry();
            const plan = getEffectiveDefinition(snapshot, "Observation", "value-quantity").compiledPlan;
            const registry = executeSearchQueryPlan(plan, "eq10|kg", "value-quantity");
            const legacy = buildLegacyFilter(
                observationHandler.paramsSearch,
                "value-quantity",
                "eq10|kg"
            );

            expect(JSON.stringify(registry)).to.not.include("valueSampledData");
            expect(JSON.stringify(legacy.filter)).to.include("valueSampledData");
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
