require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const {
    normalizeDate,
    normalizeDateTime,
    normalizeInstant
} = require("@models/FHIR/temporal");
const { executeSearchQueryPlan } = require("@models/FHIR/searchParameter/executor/mongoExecutor");
const {
    startMongoMemory,
    dropMongoTestDatabase,
    stopMongoMemory
} = require("../../support/mongo-memory");

const COMPARATORS = ["eq", "ne", "lt", "gt", "ge", "le", "sa", "eb", "ap"];

function decimal(value) {
    return mongoose.Types.Decimal128.fromString(String(value));
}

function buildPlan(path, datatype, searchType = "date") {
    return {
        estimatedCost: 1,
        searchType,
        code: path,
        extractionPaths: [{ path, datatype }],
        comparators: COMPARATORS
    };
}

function period(startScalar, endScalar) {
    return {
        start: normalizeDateTime(startScalar),
        end: normalizeDateTime(endScalar)
    };
}

async function seedCollection(collectionName, documents) {
    const collection = mongoose.connection.collection(collectionName);
    await collection.drop().catch(() => undefined);
    await collection.insertMany(documents);
}

async function queryHitSet(collectionName, filter) {
    const collection = mongoose.connection.collection(collectionName);
    const findMatches = await collection.find(filter).toArray();
    const aggregateMatches = await collection.aggregate([{ $match: filter }]).toArray();
    const findRoles = findMatches.map((entry) => entry.role).sort();
    const aggregateRoles = aggregateMatches.map((entry) => entry.role).sort();

    expect(findRoles).to.deep.equal(
        aggregateRoles,
        `find and aggregate hit-sets diverged for ${collectionName}`
    );

    return findRoles;
}

function dateFixtures() {
    const canonicalHit = normalizeDate("2020-01-01");
    const canonicalMiss = normalizeDate("2019-06-15");
    const dateTimeOnDatePath = normalizeDateTime("2020-01-01T00:00:00Z");

    return [
        { role: "canonical-hit", effective: canonicalHit },
        { role: "canonical-miss", effective: canonicalMiss },
        { role: "legacy-string", effective: canonicalHit.value },
        { role: "bson-date", effective: new Date("2020-01-01T00:00:00.000Z") },
        {
            role: "decimal-normalized-start",
            effective: {
                ...canonicalHit,
                normalizedStart: decimal("1577836800")
            }
        },
        {
            role: "partial-object",
            effective: { value: canonicalHit.value, precision: canonicalHit.precision }
        },
        { role: "wrong-datatype", effective: dateTimeOnDatePath },
        { role: "number-normalized-end", effective: { ...canonicalHit, normalizedEnd: 20200102 } }
    ];
}

function dateTimeFixtures() {
    const canonicalHit = normalizeDateTime("2020-01-01T00:00:00Z");
    const canonicalMiss = normalizeDateTime("2019-06-15T12:00:00Z");
    const dateOnDateTimePath = normalizeDate("2020-01-01");

    return [
        { role: "canonical-hit", effective: canonicalHit },
        { role: "canonical-miss", effective: canonicalMiss },
        { role: "legacy-string", effective: canonicalHit.value },
        { role: "bson-date", effective: new Date("2020-01-01T00:00:00.000Z") },
        {
            role: "string-normalized-start",
            effective: {
                ...canonicalHit,
                normalizedStart: "1577836800",
                normalizedEnd: "1577836801"
            }
        },
        {
            role: "partial-object",
            effective: { value: canonicalHit.value, precision: canonicalHit.precision }
        },
        { role: "wrong-datatype", effective: dateOnDateTimePath }
    ];
}

function instantFixtures() {
    const canonicalHit = normalizeInstant("2020-01-01T00:00:00Z");
    const canonicalMiss = normalizeInstant("2019-06-15T12:00:00Z");
    const dateTimeOnInstantPath = normalizeDateTime("2020-01-01T00:00:00Z");

    return [
        { role: "canonical-hit", effective: canonicalHit },
        { role: "canonical-miss", effective: canonicalMiss },
        { role: "legacy-string", effective: canonicalHit.value },
        { role: "bson-date", effective: new Date("2020-01-01T00:00:00.000Z") },
        {
            role: "string-epoch",
            effective: {
                ...canonicalHit,
                epochSeconds: String(canonicalHit.epochSeconds)
            }
        },
        {
            role: "bson-date-epoch",
            effective: {
                ...canonicalHit,
                epochSeconds: new Date("2020-01-01T00:00:00.000Z")
            }
        },
        {
            role: "partial-object",
            effective: { value: canonicalHit.value, precision: canonicalHit.precision }
        },
        { role: "wrong-datatype", effective: dateTimeOnInstantPath }
    ];
}

function periodFixtures() {
    const canonicalHit = period("2019-12-01T00:00:00Z", "2020-02-01T00:00:00Z");
    const canonicalMiss = period("2018-01-01T00:00:00Z", "2018-02-01T00:00:00Z");
    const hitStart = canonicalHit.start;

    return [
        { role: "canonical-hit", effective: canonicalHit },
        { role: "canonical-miss", effective: canonicalMiss },
        { role: "legacy-string-period", effective: hitStart.value },
        {
            role: "legacy-string-endpoints",
            effective: {
                start: hitStart.value,
                end: canonicalHit.end.value
            }
        },
        {
            role: "bson-date-endpoints",
            effective: {
                start: new Date("2019-12-01T00:00:00.000Z"),
                end: new Date("2020-02-01T00:00:00.000Z")
            }
        },
        {
            role: "string-normalized-start",
            effective: {
                start: {
                    ...hitStart,
                    normalizedStart: "1575158400"
                },
                end: canonicalHit.end
            }
        },
        {
            role: "partial-start",
            effective: {
                start: { value: hitStart.value },
                end: canonicalHit.end
            }
        },
        {
            role: "open-end-hit",
            effective: { start: hitStart }
        },
        {
            role: "open-start-hit",
            effective: { end: normalizeDateTime("2020-02-01T00:00:00Z") }
        },
        { role: "empty-period", effective: {} }
    ];
}

const LEGACY_MISMATCH_ROLES = [
    "legacy-string",
    "bson-date",
    "decimal-normalized-start",
    "partial-object",
    "wrong-datatype",
    "number-normalized-end",
    "string-normalized-start",
    "string-epoch",
    "bson-date-epoch",
    "legacy-string-period",
    "legacy-string-endpoints",
    "bson-date-endpoints",
    "partial-start",
    "empty-period"
];

describe("search execution hit-set acceptance", function () {
    before(async function () {
        this.timeout(120000);
        await startMongoMemory();
    });

    after(async function () {
        await dropMongoTestDatabase();
        await stopMongoMemory();
        await mongoose.disconnect();
    });

    it("keeps date find and aggregate hit-sets equivalent for canonical and legacy documents", async function () {
        const collectionName = "search_hit_set_date";
        await seedCollection(collectionName, dateFixtures());
        const filter = executeSearchQueryPlan(buildPlan("effective", "date", "date"), "2020-01-01", "effective");

        const roles = await queryHitSet(collectionName, filter);

        expect(roles).to.deep.equal(["canonical-hit"]);
        for (const role of LEGACY_MISMATCH_ROLES) {
            expect(roles).to.not.include(role);
        }
    });

    it("keeps dateTime find and aggregate hit-sets equivalent for canonical and legacy documents", async function () {
        const collectionName = "search_hit_set_datetime";
        await seedCollection(collectionName, dateTimeFixtures());
        const filter = executeSearchQueryPlan(
            buildPlan("effective", "dateTime", "dateTime"),
            "2020-01-01T00:00:00Z",
            "effective"
        );

        const roles = await queryHitSet(collectionName, filter);

        expect(roles).to.deep.equal(["canonical-hit"]);
        for (const role of LEGACY_MISMATCH_ROLES) {
            expect(roles).to.not.include(role);
        }
    });

    it("keeps instant find and aggregate hit-sets equivalent for canonical and legacy documents", async function () {
        const collectionName = "search_hit_set_instant";
        await seedCollection(collectionName, instantFixtures());
        const filter = executeSearchQueryPlan(
            buildPlan("effective", "instant", "date"),
            "2020-01-01",
            "effective"
        );

        const roles = await queryHitSet(collectionName, filter);

        expect(roles).to.deep.equal(["canonical-hit"]);
        for (const role of LEGACY_MISMATCH_ROLES) {
            expect(roles).to.not.include(role);
        }
    });

    it("keeps Period find and aggregate hit-sets equivalent for canonical and legacy documents", async function () {
        const collectionName = "search_hit_set_period";
        await seedCollection(collectionName, periodFixtures());
        const filter = executeSearchQueryPlan(
            buildPlan("effective", "Period", "date"),
            "2020-01-01",
            "effective"
        );

        const roles = await queryHitSet(collectionName, filter);

        expect(roles.sort()).to.deep.equal([
            "canonical-hit",
            "open-end-hit",
            "open-start-hit"
        ]);
        for (const role of LEGACY_MISMATCH_ROLES) {
            expect(roles).to.not.include(role);
        }
    });

    describe("BSON type mismatch regression", function () {
        it("rejects legacy string, BSON Date, and wrong field types consistently in find and aggregate", async function () {
            const cases = [
                {
                    collectionName: "search_hit_set_bson_date",
                    fixtures: dateFixtures(),
                    plan: buildPlan("effective", "date", "date"),
                    query: "ge2020",
                    expectedHits: ["canonical-hit"]
                },
                {
                    collectionName: "search_hit_set_bson_datetime",
                    fixtures: dateTimeFixtures(),
                    plan: buildPlan("effective", "dateTime", "dateTime"),
                    query: "ge2020-01-01T00:00:00Z",
                    expectedHits: ["canonical-hit"]
                },
                {
                    collectionName: "search_hit_set_bson_instant",
                    fixtures: instantFixtures(),
                    plan: buildPlan("effective", "instant", "date"),
                    query: "ge2020-01-01",
                    expectedHits: ["canonical-hit"]
                },
                {
                    collectionName: "search_hit_set_bson_period",
                    fixtures: periodFixtures(),
                    plan: buildPlan("effective", "Period", "date"),
                    query: "2020-01-01",
                    expectedHits: ["canonical-hit", "open-end-hit", "open-start-hit"]
                }
            ];

            for (const testCase of cases) {
                await seedCollection(testCase.collectionName, testCase.fixtures);
                const filter = executeSearchQueryPlan(
                    testCase.plan,
                    testCase.query,
                    "effective"
                );
                const roles = await queryHitSet(testCase.collectionName, filter);

                expect(roles.sort()).to.deep.equal(testCase.expectedHits.sort());
                for (const role of LEGACY_MISMATCH_ROLES) {
                    expect(roles, `${testCase.collectionName}:${role}`).to.not.include(role);
                }
            }
        });

        it("matches canonical-miss documents consistently for ordered lt comparators", async function () {
            const cases = [
                {
                    collectionName: "search_hit_set_date_lt",
                    fixtures: dateFixtures(),
                    plan: buildPlan("effective", "date", "date"),
                    query: "lt2020-01-01",
                    expectedHits: ["canonical-miss"]
                },
                {
                    collectionName: "search_hit_set_datetime_lt",
                    fixtures: dateTimeFixtures(),
                    plan: buildPlan("effective", "dateTime", "dateTime"),
                    query: "lt2020-01-01T00:00:00Z",
                    expectedHits: ["canonical-miss"]
                },
                {
                    collectionName: "search_hit_set_instant_lt",
                    fixtures: instantFixtures(),
                    plan: buildPlan("effective", "instant", "date"),
                    query: "lt2020-01-01",
                    expectedHits: ["canonical-miss"]
                },
                {
                    collectionName: "search_hit_set_period_lt",
                    fixtures: [
                        {
                            role: "canonical-miss",
                            effective: period("2018-01-01T00:00:00Z", "2018-02-01T00:00:00Z")
                        },
                        {
                            role: "canonical-hit",
                            effective: period("2019-12-01T00:00:00Z", "2020-02-01T00:00:00Z")
                        }
                    ],
                    plan: buildPlan("effective", "Period", "date"),
                    query: "lt2019-01-01",
                    expectedHits: ["canonical-miss"]
                }
            ];

            for (const testCase of cases) {
                await seedCollection(testCase.collectionName, testCase.fixtures);
                const filter = executeSearchQueryPlan(
                    testCase.plan,
                    testCase.query,
                    "effective"
                );
                const roles = await queryHitSet(testCase.collectionName, filter);

                expect(roles.sort()).to.deep.equal(testCase.expectedHits.sort());
                for (const role of LEGACY_MISMATCH_ROLES) {
                    expect(roles, `${testCase.collectionName}:${role}`).to.not.include(role);
                }
            }
        });
    });
});
