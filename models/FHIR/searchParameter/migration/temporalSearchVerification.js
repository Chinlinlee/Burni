const mongoose = require("mongoose");
const { compileDefinition } = require("../compiler/compiler");
const { executeSearchQueryPlan } = require("../executor/mongoExecutor");
const {
    normalizeDate,
    normalizeDateTime,
    normalizeInstant
} = require("../../temporal");

const COMPARATORS = ["eq", "ne", "lt", "gt", "ge", "le", "sa", "eb", "ap"];
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
    "empty-period",
    "raw",
    "contained-raw",
    "history-raw",
    "cross-element"
];

/**
 * @param {string} code
 * @param {string} message
 * @param {Record<string, unknown>} [details]
 */
function diagnostic(code, message, details = {}) {
    return { code, message, ...details };
}

/**
 * @param {import("mongoose").Connection} connection
 * @returns {import("mongodb").Db}
 */
function requireNativeDb(connection) {
    const db = connection.db;
    if (!db || typeof db.collection !== "function") {
        throw new Error(
            "temporalSearchVerification requires a connected Mongoose connection with db.collection"
        );
    }
    return db;
}

/**
 * @param {number | string} value
 * @returns {import("mongoose").Types.Decimal128}
 */
function decimal(value) {
    return mongoose.Types.Decimal128.fromString(String(value));
}

/**
 * @param {string} path
 * @param {string} datatype
 * @param {string[]} [arrayPaths]
 * @param {string} [searchType]
 */
function buildPlan(path, datatype, arrayPaths = [], searchType = "date") {
    return {
        estimatedCost: 1,
        searchType,
        code: path,
        extractionPaths: [
            {
                path,
                datatype,
                ...(arrayPaths.length > 0 ? { arrayPaths } : {})
            }
        ],
        comparators: COMPARATORS
    };
}

/**
 * @param {string} startScalar
 * @param {string} endScalar
 */
function period(startScalar, endScalar) {
    return {
        start: normalizeDateTime(startScalar),
        end: normalizeDateTime(endScalar)
    };
}

function dateTime(start, end = Number(start) + 1) {
    return {
        value: "2020-01-01T00:00:00Z",
        precision: "second",
        normalizedStart: decimal(start),
        normalizedEnd: decimal(end)
    };
}

function canonicalPeriod(start, end) {
    return {
        start: dateTime(start),
        end: dateTime(end)
    };
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

/**
 * @returns {Array<{
 *   id: string,
 *   collectionName: string,
 *   fixtures: object[],
 *   plan: object,
 *   query: string,
 *   parameterName: string,
 *   expectedHits: string[],
 *   rejectRoles?: string[]
 * }>}
 */
function buildRepresentativeScenarios() {
    const choiceDefinition = {
        resource: {
            resourceType: "SearchParameter",
            url: "http://example.org/SearchParameter/observation-effective",
            version: "4.0.1",
            status: "active",
            code: "observation-effective",
            base: ["Observation"],
            type: "date",
            expression: "Observation.effective"
        },
        canonicalKey: "http://example.org/SearchParameter/observation-effective::4.0.1",
        lookupKeys: ["Observation::observation-effective"]
    };
    const choicePlan = compileDefinition(choiceDefinition).lookupPlans[
        "Observation::observation-effective"
    ].plan;

    return [
        {
            id: "date-precision",
            collectionName: "temporal_verify_date",
            fixtures: dateFixtures(),
            plan: buildPlan("effective", "date", [], "date"),
            query: "2020-01-01",
            parameterName: "effective",
            expectedHits: ["canonical-hit"],
            rejectRoles: LEGACY_MISMATCH_ROLES
        },
        {
            id: "datetime-precision",
            collectionName: "temporal_verify_datetime",
            fixtures: dateTimeFixtures(),
            plan: buildPlan("effective", "dateTime", [], "dateTime"),
            query: "2020-01-01T00:00:00Z",
            parameterName: "effective",
            expectedHits: ["canonical-hit"],
            rejectRoles: LEGACY_MISMATCH_ROLES
        },
        {
            id: "instant-precision",
            collectionName: "temporal_verify_instant",
            fixtures: instantFixtures(),
            plan: buildPlan("effective", "instant", [], "date"),
            query: "2020-01-01",
            parameterName: "effective",
            expectedHits: ["canonical-hit"],
            rejectRoles: LEGACY_MISMATCH_ROLES
        },
        {
            id: "period-comparator",
            collectionName: "temporal_verify_period",
            fixtures: periodFixtures(),
            plan: buildPlan("effective", "Period", [], "date"),
            query: "2020-01-01",
            parameterName: "effective",
            expectedHits: ["canonical-hit", "open-end-hit", "open-start-hit"],
            rejectRoles: LEGACY_MISMATCH_ROLES
        },
        {
            id: "date-comparator-lt",
            collectionName: "temporal_verify_date_lt",
            fixtures: dateFixtures(),
            plan: buildPlan("effective", "date", [], "date"),
            query: "lt2020-01-01",
            parameterName: "effective",
            expectedHits: ["canonical-miss"],
            rejectRoles: LEGACY_MISMATCH_ROLES
        },
        {
            id: "array-correlation",
            collectionName: "temporal_verify_array",
            fixtures: [
                {
                    role: "cross-element",
                    events: [
                        {
                            normalizedStart: decimal("1577836800"),
                            normalizedEnd: decimal("1577836810")
                        },
                        {
                            normalizedStart: decimal("1577836790"),
                            normalizedEnd: decimal("1577836801")
                        }
                    ]
                },
                {
                    role: "same-element",
                    events: [
                        {
                            normalizedStart: decimal("1577836800"),
                            normalizedEnd: decimal("1577836801")
                        }
                    ]
                }
            ],
            plan: buildPlan("events", "dateTime", ["events"], "dateTime"),
            query: "2020-01-01T00:00:00Z",
            parameterName: "events",
            expectedHits: ["same-element"],
            rejectRoles: ["cross-element"]
        },
        {
            id: "choice-branches",
            collectionName: "temporal_verify_choice",
            fixtures: [
                { role: "dateTime", effectiveDateTime: dateTime("1577836800") },
                {
                    role: "period",
                    effectivePeriod: canonicalPeriod("1577836790", "1577923210")
                },
                { role: "instant", effectiveInstant: { epochSeconds: decimal("1577836800") } },
                {
                    role: "raw",
                    effectiveDateTime: { value: "2020-01-01T00:00:00Z" }
                }
            ],
            plan: choicePlan,
            query: "2020-01-01",
            parameterName: "date",
            expectedHits: ["dateTime", "instant", "period"],
            rejectRoles: ["raw"]
        },
        {
            id: "contained-temporal",
            collectionName: "temporal_verify_contained",
            fixtures: [
                {
                    role: "contained-hit",
                    contained: [
                        {
                            resourceType: "Observation",
                            effectiveDateTime: dateTime("1577836800")
                        }
                    ]
                },
                {
                    role: "contained-raw",
                    contained: [
                        {
                            resourceType: "Observation",
                            effectiveDateTime: { value: "2020-01-01T00:00:00Z" }
                        }
                    ]
                }
            ],
            plan: buildPlan("contained.effectiveDateTime", "dateTime", ["contained"], "date"),
            query: "2020-01-01",
            parameterName: "contained-date",
            expectedHits: ["contained-hit"],
            rejectRoles: ["contained-raw"]
        },
        {
            id: "history-temporal",
            collectionName: "temporal_verify_history",
            fixtures: [
                {
                    role: "history-hit",
                    meta: { versionId: "1" },
                    birthDate: {
                        value: "2020-01-01",
                        precision: "day",
                        normalizedStart: "2020-01-01",
                        normalizedEnd: "2020-01-02"
                    }
                },
                {
                    role: "history-raw",
                    meta: { versionId: "2" },
                    birthDate: "2020-01-01"
                }
            ],
            plan: buildPlan("birthDate", "date", [], "date"),
            query: "2020-01-01",
            parameterName: "birthdate",
            expectedHits: ["history-hit"],
            rejectRoles: ["history-raw"]
        }
    ];
}

/**
 * @param {import("mongodb").Collection} collection
 * @param {object[]} documents
 */
async function seedCollection(collection, documents) {
    await collection.drop().catch(() => undefined);
    if (documents.length > 0) {
        await collection.insertMany(documents);
    }
}

/**
 * @param {import("mongodb").Collection} collection
 * @param {object} filter
 * @returns {Promise<string[]>}
 */
async function queryHitSetRoles(collection, filter) {
    const findMatches = await collection.find(filter).toArray();
    const aggregateMatches = await collection.aggregate([{ $match: filter }]).toArray();
    const findRoles = findMatches.map((entry) => entry.role).sort();
    const aggregateRoles = aggregateMatches.map((entry) => entry.role).sort();

    if (JSON.stringify(findRoles) !== JSON.stringify(aggregateRoles)) {
        throw new Error(
            `find and aggregate hit-sets diverged: find=${findRoles.join(",")}, aggregate=${aggregateRoles.join(",")}`
        );
    }

    return findRoles;
}

/**
 * @param {object} input
 * @param {import("mongoose").Connection} input.targetConnection
 * @param {Array<object>} [input.scenarios]
 * @returns {Promise<{
 *   valid: boolean,
 *   diagnostics: Array<object>,
 *   summary: {
 *     scenarioCount: number,
 *     passedScenarios: number,
 *     failedScenarios: number
 *   },
 *   scenarios: Array<object>
 * }>}
 */
async function verifyTemporalSearchHitSets({
    targetConnection,
    scenarios = buildRepresentativeScenarios()
}) {
    const db = requireNativeDb(targetConnection);
    /** @type {Array<object>} */
    const diagnostics = [];
    /** @type {Array<object>} */
    const scenarioResults = [];
    let passedScenarios = 0;

    for (const scenario of scenarios) {
        const collection = db.collection(scenario.collectionName);
        /** @type {Array<object>} */
        const scenarioDiagnostics = [];

        try {
            await seedCollection(collection, scenario.fixtures);
            const filter = executeSearchQueryPlan(
                scenario.plan,
                scenario.query,
                scenario.parameterName
            );
            const roles = await queryHitSetRoles(collection, filter);
            const expectedHits = [...scenario.expectedHits].sort();
            const actualHits = [...roles].sort();

            if (JSON.stringify(actualHits) !== JSON.stringify(expectedHits)) {
                scenarioDiagnostics.push(
                    diagnostic(
                        "temporal-search-hit-set-mismatch",
                        "Representative temporal search hit-set did not match expected roles",
                        {
                            scenarioId: scenario.id,
                            expectedHits,
                            actualHits
                        }
                    )
                );
            }

            for (const rejectRole of scenario.rejectRoles || []) {
                if (roles.includes(rejectRole)) {
                    scenarioDiagnostics.push(
                        diagnostic(
                            "temporal-search-hit-set-legacy-leak",
                            "Legacy or non-canonical document matched a canonical temporal search",
                            {
                                scenarioId: scenario.id,
                                rejectRole
                            }
                        )
                    );
                }
            }
        } catch (error) {
            scenarioDiagnostics.push(
                diagnostic(
                    "temporal-search-hit-set-error",
                    "Representative temporal search verification failed",
                    {
                        scenarioId: scenario.id,
                        message: error instanceof Error ? error.message : String(error)
                    }
                )
            );
        }

        const passed = scenarioDiagnostics.length === 0;
        if (passed) {
            passedScenarios += 1;
        }
        scenarioResults.push({
            id: scenario.id,
            collectionName: scenario.collectionName,
            passed,
            diagnostics: scenarioDiagnostics
        });
        diagnostics.push(...scenarioDiagnostics);
    }

    return {
        valid: diagnostics.length === 0,
        diagnostics,
        summary: {
            scenarioCount: scenarios.length,
            passedScenarios,
            failedScenarios: scenarios.length - passedScenarios
        },
        scenarios: scenarioResults
    };
}

module.exports = {
    buildRepresentativeScenarios,
    verifyTemporalSearchHitSets
};
