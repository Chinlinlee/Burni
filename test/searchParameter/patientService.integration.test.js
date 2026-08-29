require("module-alias/register");

const { expect } = require("chai");
const f201Fixture = require("../fixtures/patient-example-f201-roel.json");
const {
    startMongoMemoryTestContext,
    stopMongoMemoryTestContext,
    clearPatientCollection,
    createPatientViaService,
    readPatientViaService,
    searchPatientViaService,
    getBundlePatientIds
} = require("./mongoMemoryHelper");
const { reloadRegistry } = require("@models/FHIR/searchParameter/registry/registryManager");
const { resolveLookupStatus } = require("@models/FHIR/searchParameter/registry/snapshot");
const { executeSearchQueryPlan } = require("@models/FHIR/searchParameter/executor/mongoExecutor");
const { getEffectiveDefinition } = require("@models/FHIR/searchParameter/registry/snapshot");
const { ADDRESS_STRING_FIELDS } = require("@models/FHIR/searchParameter/executor/searchTypeProjection");

const EFFECTIVE_PATIENT_CODES = [
    "active",
    "address",
    "address-city",
    "address-country",
    "address-postalcode",
    "address-state",
    "address-use",
    "birthdate",
    "death-date",
    "deceased",
    "email",
    "family",
    "gender",
    "general-practitioner",
    "given",
    "identifier",
    "language",
    "link",
    "name",
    "organization",
    "phone",
    "phonetic",
    "telecom"
];

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
        deceasedDateTime: "2020-01-15",
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
        communication: [
            {
                language: {
                    coding: [{ system: "urn:ietf:bcp:47", code: "en-US", display: "English" }]
                },
                preferred: true
            }
        ],
        managingOrganization: { reference: "Organization/other-org", display: "Other Org" },
        telecom: [{ system: "phone", value: "+31000000000", use: "mobile" }]
    };
}

/** @type {Array<{ code: string, query: Record<string, string>, expectHit: "main" | "companion" | "none" }>} */
const PATIENT_SEARCH_CASES = [
    { code: "active", query: { active: "true" }, expectHit: "main" },
    { code: "address", query: { address: "Amsterdam" }, expectHit: "main" },
    { code: "address-city", query: { "address-city": "Amsterdam" }, expectHit: "main" },
    { code: "address-country", query: { "address-country": "NLD" }, expectHit: "main" },
    { code: "address-postalcode", query: { "address-postalcode": "1055RW" }, expectHit: "main" },
    { code: "address-state", query: { "address-state": "ZH" }, expectHit: "companion" },
    { code: "address-use", query: { "address-use": "home" }, expectHit: "main" },
    { code: "birthdate", query: { birthdate: "1960-03-13" }, expectHit: "main" },
    { code: "death-date", query: { "death-date": "2020-01-15" }, expectHit: "companion" },
    { code: "deceased", query: { deceased: "false" }, expectHit: "main" },
    { code: "email", query: { email: "roel.bor@example.org" }, expectHit: "main" },
    { code: "family", query: { family: "Bor" }, expectHit: "main" },
    { code: "gender", query: { gender: "male" }, expectHit: "main" },
    { code: "general-practitioner", query: { "general-practitioner": "Practitioner/gp-example" }, expectHit: "main" },
    { code: "given", query: { given: "Roelof" }, expectHit: "main" },
    {
        code: "identifier",
        query: { identifier: "urn:oid:2.16.840.1.113883.2.4.6.3|123456789" },
        expectHit: "main"
    },
    { code: "language", query: { language: "nl-NL" }, expectHit: "main" },
    { code: "link", query: { link: "Patient/link-target" }, expectHit: "main" },
    { code: "name", query: { name: "Roel" }, expectHit: "main" },
    { code: "organization", query: { organization: "Organization/f201" }, expectHit: "main" },
    { code: "phone", query: { phone: "+31612345678" }, expectHit: "main" },
    { code: "phonetic", query: { phonetic: "Bor" }, expectHit: "main" },
    { code: "telecom", query: { telecom: "+31612345678" }, expectHit: "main" }
];

describe("Patient service-level registry search integration", function () {
    /** @type {string} */
    let mainPatientId;
    /** @type {string} */
    let companionPatientId;

    before(async function () {
        this.timeout(120000);
        await startMongoMemoryTestContext();
    });

    after(async function () {
        await stopMongoMemoryTestContext();
    });

    beforeEach(async function () {
        await clearPatientCollection();
        const mainPatient = await createPatientViaService(buildMainPatientFixture(f201Fixture));
        const companionPatient = await createPatientViaService(buildCompanionPatientFixture());
        mainPatientId = mainPatient.id;
        companionPatientId = companionPatient.id;
    });

    it("creates and reads Patient through FHIR services", async function () {
        const readResult = await readPatientViaService(mainPatientId);
        expect(readResult.status).to.equal(true);
        expect(readResult.code).to.equal(200);
        expect(readResult.result.id).to.equal(mainPatientId);
        expect(readResult.result.gender).to.equal("male");
    });

    it("exposes 23 effective Patient registry codes", async function () {
        const snapshot = await reloadRegistry();
        const effectiveCodes = [...snapshot.byLookupKey.keys()]
            .filter((key) => key.startsWith("Patient::"))
            .map((key) => key.split("::")[1])
            .sort();
        expect(effectiveCodes).to.deep.equal(EFFECTIVE_PATIENT_CODES);
        expect(PATIENT_SEARCH_CASES.map((item) => item.code).sort()).to.deep.equal(EFFECTIVE_PATIENT_CODES);
    });

    for (const searchCase of PATIENT_SEARCH_CASES) {
        it(`searches Patient?${Object.entries(searchCase.query).map(([k, v]) => `${k}=${v}`).join("&")} with expected hit-set`, async function () {
            const searchResult = await searchPatientViaService(searchCase.query);
            expect(searchResult.status).to.equal(true);
            expect(searchResult.code).to.equal(200);
            expect(searchResult.result.resourceType).to.equal("Bundle");

            const hitIds = getBundlePatientIds(searchResult.result);
            const expectedId =
                searchCase.expectHit === "main"
                    ? mainPatientId
                    : searchCase.expectHit === "companion"
                      ? companionPatientId
                      : null;
            const excludedId =
                searchCase.expectHit === "main"
                    ? companionPatientId
                    : searchCase.expectHit === "companion"
                      ? mainPatientId
                      : null;

            if (expectedId) {
                expect(hitIds, `expected ${searchCase.code} to match stored patient ${expectedId}`).to.include(
                    expectedId
                );
            }
            if (excludedId) {
                expect(hitIds, `expected ${searchCase.code} to exclude patient ${excludedId}`).to.not.include(
                    excludedId
                );
            }
        });
    }

    it("searches deceased=true across boolean and dateTime choice branches", async function () {
        await clearPatientCollection();
        const booleanPatient = await createPatientViaService({
            resourceType: "Patient",
            deceasedBoolean: true,
            name: [{ family: "DeadBool" }]
        });
        const dateTimePatient = await createPatientViaService({
            resourceType: "Patient",
            deceasedDateTime: "2019-05-01",
            name: [{ family: "DeadDate" }]
        });
        await createPatientViaService({
            resourceType: "Patient",
            name: [{ family: "Alive" }]
        });

        const searchResult = await searchPatientViaService({ deceased: "true" });
        const hitIds = getBundlePatientIds(searchResult.result);
        expect(hitIds).to.include(booleanPatient.id);
        expect(hitIds).to.include(dateTimePatient.id);
        expect(hitIds).to.have.length(2);
    });

    it("does not treat absent deceased as explicit false", async function () {
        await clearPatientCollection();
        const alivePatient = await createPatientViaService({
            resourceType: "Patient",
            name: [{ family: "Alive" }]
        });
        const searchResult = await searchPatientViaService({ deceased: "false" });
        const hitIds = getBundlePatientIds(searchResult.result);
        expect(hitIds).to.not.include(alivePatient.id);
    });

    it("does not include Address.text in address-city projection", async function () {
        const snapshot = await reloadRegistry();
        const definition = getEffectiveDefinition(snapshot, "Patient", "address-city");
        const filter = executeSearchQueryPlan(definition.compiledPlan, "Rotterdam office", "address-city");
        expect(JSON.stringify(filter)).to.include("address.city");
        expect(JSON.stringify(filter)).to.not.include("address.text");
        expect(ADDRESS_STRING_FIELDS).to.not.include("text");
    });

    for (const code of EFFECTIVE_PATIENT_CODES) {
        it(`supports ${code}:missing=true/false`, async function () {
            const snapshot = await reloadRegistry();
            const definition = getEffectiveDefinition(snapshot, "Patient", code);
            expect(definition?.compiledPlan).to.exist;

            const presentFilter = executeSearchQueryPlan(definition.compiledPlan, "false", `${code}:missing`);
            const absentFilter = executeSearchQueryPlan(definition.compiledPlan, "true", `${code}:missing`);
            expect(presentFilter).to.exist;
            expect(absentFilter).to.exist;
            expect(JSON.stringify(presentFilter)).to.not.equal(JSON.stringify(absentFilter));
        });
    }

    it("rejects an unsupported modifier on a string Patient parameter", async function () {
        const searchResult = await searchPatientViaService({ "family:not": "Bor" });
        expect(searchResult.status).to.equal(false);
        expect(searchResult.code).to.equal(400);
    });

    it("skips disabled Patient search codes without legacy fallback", async function () {
        const snapshot = await reloadRegistry();
        const disabledCode = [...snapshot.disabledLookupKeys]
            .find((key) => key.startsWith("Patient::"))
            ?.split("::")[1];

        if (!disabledCode) {
            this.skip();
        }

        expect(resolveLookupStatus(snapshot, "Patient", disabledCode)).to.equal("disabled");

        const searchResult = await searchPatientViaService({ [disabledCode]: "test-value" });
        expect(searchResult.status).to.equal(false);
        expect(searchResult.code).to.equal(400);
        expect(searchResult.result.resourceType).to.equal("OperationOutcome");
    });
});
