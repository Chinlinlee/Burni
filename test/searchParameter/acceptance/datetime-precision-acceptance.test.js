require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const { spawnSync } = require("child_process");
const {
    parseTemporalQueryValue,
    normalizeTemporalQueryRange
} = require("@models/FHIR/searchParameter/executor/temporalQueryParser");
const {
    buildTemporalFilter,
    buildRangeFilter,
    approximateDecimalRange
} = require("@models/FHIR/searchParameter/executor/temporalQueryFilter");
const { executeSearchQueryPlan } = require("@models/FHIR/searchParameter/executor/mongoExecutor");
const { normalizeDateTime } = require("@models/FHIR/temporal");

describe("dateTime precision acceptance", function () {
    const FIELD = "effective";
    const COMPARATORS = ["eq", "ne", "lt", "gt", "ge", "le", "sa", "eb", "ap"];
    const START_FIELD = `${FIELD}.normalizedStart`;
    const END_FIELD = `${FIELD}.normalizedEnd`;

    function decimal128(value) {
        return mongoose.Types.Decimal128.fromString(String(value));
    }

    function utcEpochSeconds(year, month, day, hour = 0, minute = 0, second = 0) {
        return String(Date.UTC(year, month - 1, day, hour, minute, second) / 1000);
    }

    const PRECISION_FIXTURES = [
        {
            precision: "year",
            bareValue: "2020",
            start: utcEpochSeconds(2020, 1, 1),
            end: utcEpochSeconds(2021, 1, 1)
        },
        {
            precision: "month",
            bareValue: "2020-02",
            start: utcEpochSeconds(2020, 2, 1),
            end: utcEpochSeconds(2020, 3, 1)
        },
        {
            precision: "day",
            bareValue: "2020-02-29",
            start: utcEpochSeconds(2020, 2, 29),
            end: utcEpochSeconds(2020, 3, 1)
        },
        {
            precision: "minute",
            bareValue: "2020-02-29T23:59",
            start: utcEpochSeconds(2020, 2, 29, 23, 59),
            end: utcEpochSeconds(2020, 3, 1, 0, 0)
        },
        {
            precision: "second",
            bareValue: "2020-01-01T00:00:00+02:00",
            start: utcEpochSeconds(2019, 12, 31, 22, 0, 0),
            end: utcEpochSeconds(2019, 12, 31, 22, 0, 1)
        },
        {
            precision: "fraction",
            bareValue: "2020-01-01T00:00:00.123400-02:00",
            start: "1577844000.123400",
            end: "1577844000.123401",
            fractionDigits: 6
        }
    ];

    const TIMEZONE_EQUIVALENCE_GROUPS = [
        {
            label: "+02:00 wall clock equals Z at earlier UTC instant",
            values: ["2020-01-01T00:00:00+02:00", "2019-12-31T22:00:00Z"],
            start: utcEpochSeconds(2019, 12, 31, 22, 0, 0),
            end: utcEpochSeconds(2019, 12, 31, 22, 0, 1)
        },
        {
            label: "-05:00 wall clock equals Z at later UTC instant",
            values: ["2020-06-15T12:00:00-05:00", "2020-06-15T17:00:00Z"],
            start: utcEpochSeconds(2020, 6, 15, 17, 0, 0),
            end: utcEpochSeconds(2020, 6, 15, 17, 0, 1)
        },
        {
            label: "timezone-less minute is UTC, not offset-adjusted",
            values: ["2015-02-07T13:28", "2015-02-07T13:28Z"],
            start: utcEpochSeconds(2015, 2, 7, 13, 28),
            end: utcEpochSeconds(2015, 2, 7, 13, 29)
        }
    ];

    const HIGH_PRECISION_FRACTION = {
        bareValue: "2020-01-01T00:00:00.123456789012345678+00:00",
        start: "1577836800.123456789012345678",
        end: "1577836800.123456789012345679",
        fractionDigits: 18
    };

    function dateTimePlan() {
        return {
            estimatedCost: 1,
            searchType: "dateTime",
            code: "effective",
            extractionPaths: [{ path: FIELD, datatype: "dateTime" }],
            comparators: COMPARATORS
        };
    }

    function comparisonRange(start, end, comparator) {
        const range = {
            kind: "dateTime",
            start: decimal128(start),
            end: decimal128(end)
        };
        if (comparator === "ap") {
            const approximated = approximateDecimalRange(range);
            return {
                kind: "dateTime",
                start: approximated.start,
                end: approximated.end
            };
        }
        return range;
    }

    function expectedFilter(start, end, comparator) {
        const range = comparisonRange(start, end, comparator);
        return buildRangeFilter(START_FIELD, END_FIELD, range, comparator);
    }

    function prefixedValue(comparator, bareValue) {
        return `${comparator}${bareValue}`;
    }

    function expectDecimal128Range(range, start, end) {
        expect(range.kind).to.equal("dateTime");
        expect(range.start).to.be.instanceOf(mongoose.Types.Decimal128);
        expect(range.end).to.be.instanceOf(mongoose.Types.Decimal128);
        expect(range.start.toString()).to.equal(String(start));
        expect(range.end.toString()).to.equal(String(end));
    }

    describe("normalizeDateTime", function () {
        for (const fixture of PRECISION_FIXTURES) {
            it(`normalizes ${fixture.precision} precision to Decimal128 [start, end)`, function () {
                const canonical = normalizeDateTime(fixture.bareValue);
                expect(canonical.precision).to.equal(fixture.precision);
                expect(canonical.normalizedStart.toString()).to.equal(fixture.start);
                expect(canonical.normalizedEnd.toString()).to.equal(fixture.end);
                if (fixture.fractionDigits !== undefined) {
                    expect(canonical.fractionDigits).to.equal(fixture.fractionDigits);
                }
            });
        }

        it("preserves high-precision fraction Decimal128 boundaries", function () {
            const canonical = normalizeDateTime(HIGH_PRECISION_FRACTION.bareValue);
            expect(canonical.fractionDigits).to.equal(HIGH_PRECISION_FRACTION.fractionDigits);
            expect(canonical.normalizedStart.toString()).to.equal(HIGH_PRECISION_FRACTION.start);
            expect(canonical.normalizedEnd.toString()).to.equal(HIGH_PRECISION_FRACTION.end);
        });

        for (const group of TIMEZONE_EQUIVALENCE_GROUPS) {
            it(`maps equivalent representations to identical boundaries (${group.label})`, function () {
                const ranges = group.values.map((value) => normalizeDateTime(value));
                for (const canonical of ranges) {
                    expect(canonical.normalizedStart.toString()).to.equal(group.start);
                    expect(canonical.normalizedEnd.toString()).to.equal(group.end);
                }
                expect(ranges[0].normalizedStart.toString()).to.equal(
                    ranges[1].normalizedStart.toString()
                );
            });
        }
    });

    describe("normalizeTemporalQueryRange", function () {
        for (const fixture of PRECISION_FIXTURES) {
            it(`derives ${fixture.precision} query range from bare value`, function () {
                const range = normalizeTemporalQueryRange(fixture.bareValue, "dateTime");
                expectDecimal128Range(range, fixture.start, fixture.end);
            });
        }

        it("matches normalizeDateTime for high-precision fraction input", function () {
            const canonical = normalizeDateTime(HIGH_PRECISION_FRACTION.bareValue);
            const range = normalizeTemporalQueryRange(HIGH_PRECISION_FRACTION.bareValue, "dateTime");
            expect(range.start.toString()).to.equal(canonical.normalizedStart.toString());
            expect(range.end.toString()).to.equal(canonical.normalizedEnd.toString());
        });
    });

    describe("parseTemporalQueryValue", function () {
        for (const fixture of PRECISION_FIXTURES) {
            it(`preserves ${fixture.precision} precision and Decimal128 range`, function () {
                const parsed = parseTemporalQueryValue(fixture.bareValue, "dateTime");
                expect(parsed).to.include({
                    rawValue: fixture.bareValue,
                    value: fixture.bareValue,
                    kind: "dateTime",
                    precision: fixture.precision
                });
                expectDecimal128Range(parsed.range, fixture.start, fixture.end);
                expect(parsed.queryStart.toString()).to.equal(fixture.start);
                expect(parsed.queryEnd.toString()).to.equal(fixture.end);
                if (fixture.fractionDigits !== undefined) {
                    expect(parsed.fractionDigits).to.equal(fixture.fractionDigits);
                }
            });
        }

        for (const group of TIMEZONE_EQUIVALENCE_GROUPS) {
            it(`parses equivalent timezone forms to identical ranges (${group.label})`, function () {
                const parsedRanges = group.values.map((value) =>
                    parseTemporalQueryValue(value, "dateTime").range
                );
                for (const range of parsedRanges) {
                    expectDecimal128Range(range, group.start, group.end);
                }
                expect(parsedRanges[0].start.toString()).to.equal(parsedRanges[1].start.toString());
                expect(parsedRanges[0].end.toString()).to.equal(parsedRanges[1].end.toString());
            });
        }

        it("keeps comparator prefixes across minute, second, and fraction precisions", function () {
            const targets = PRECISION_FIXTURES.filter((fixture) =>
                ["minute", "second", "fraction"].includes(fixture.precision)
            );
            for (const fixture of targets) {
                for (const comparator of COMPARATORS) {
                    const rawValue = prefixedValue(comparator, fixture.bareValue);
                    const parsed = parseTemporalQueryValue(rawValue, "dateTime");
                    expect(parsed.comparator).to.equal(comparator);
                    expectDecimal128Range(parsed.range, fixture.start, fixture.end);
                }
            }
        });
    });

    describe("buildTemporalFilter", function () {
        for (const fixture of PRECISION_FIXTURES) {
            for (const comparator of COMPARATORS) {
                it(`builds ${comparator} filter for ${fixture.precision} precision`, function () {
                    const rawValue = prefixedValue(comparator, fixture.bareValue);
                    const temporal = parseTemporalQueryValue(rawValue, "dateTime");
                    const filter = buildTemporalFilter(FIELD, "dateTime", temporal, comparator);
                    expect(filter).to.deep.equal(
                        expectedFilter(fixture.start, fixture.end, comparator)
                    );
                });
            }
        }

        for (const group of TIMEZONE_EQUIVALENCE_GROUPS) {
            it(`builds identical eq filters for equivalent timezone values (${group.label})`, function () {
                const filters = group.values.map((value) => {
                    const temporal = parseTemporalQueryValue(value, "dateTime");
                    return buildTemporalFilter(FIELD, "dateTime", temporal, "eq");
                });
                expect(filters[0]).to.deep.equal(filters[1]);
                expect(filters[0]).to.deep.equal(expectedFilter(group.start, group.end, "eq"));
            });
        }
    });

    describe("executeSearchQueryPlan", function () {
        for (const fixture of PRECISION_FIXTURES.filter((entry) =>
            ["minute", "second", "fraction"].includes(entry.precision)
        )) {
            for (const comparator of COMPARATORS) {
                it(`executes ${comparator} plan for ${fixture.precision} precision`, function () {
                    const rawValue = prefixedValue(comparator, fixture.bareValue);
                    const filter = executeSearchQueryPlan(dateTimePlan(), rawValue, FIELD);
                    expect(filter).to.deep.equal(
                        expectedFilter(fixture.start, fixture.end, comparator)
                    );
                });
            }
        }

        it("uses Decimal128 normalized fields for high-precision fraction ge query", function () {
            const filter = executeSearchQueryPlan(
                dateTimePlan(),
                prefixedValue("ge", HIGH_PRECISION_FRACTION.bareValue),
                FIELD
            );
            expect(filter.$or[0][END_FIELD].$gt).to.be.instanceOf(mongoose.Types.Decimal128);
            expect(filter.$or[1][START_FIELD].$gte).to.be.instanceOf(mongoose.Types.Decimal128);
            expect(filter.$or[1][START_FIELD].$gte.toString()).to.equal(
                HIGH_PRECISION_FRACTION.start
            );
        });
    });

    describe("timezone determinism", function () {
        const CHILD_SCRIPT = `
require("module-alias/register");

const { normalizeDateTime } = require("./models/FHIR/temporal");
const { parseTemporalQueryValue } = require("./models/FHIR/searchParameter/executor/temporalQueryParser");
const { buildTemporalFilter } = require("./models/FHIR/searchParameter/executor/temporalQueryFilter");

function plain(value) {
    if (value && typeof value.toString === "function" && value._bsontype === "Decimal128") {
        return value.toString();
    }
    if (Array.isArray(value)) {
        return value.map(plain);
    }
    if (value && typeof value === "object") {
        return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, plain(entry)]));
    }
    return value;
}

const timezoneLessMinute = normalizeDateTime("2015-02-07T13:28");
const timezoneLessParsed = parseTemporalQueryValue("2015-02-07T13:28", "dateTime");
const offsetParsed = parseTemporalQueryValue("2020-01-01T00:00:00+02:00", "dateTime");
const utcParsed = parseTemporalQueryValue("2019-12-31T22:00:00Z", "dateTime");
const offsetFilter = buildTemporalFilter(
    "effective",
    "dateTime",
    parseTemporalQueryValue("2020-01-01T00:00:00+02:00", "dateTime"),
    "eq"
);
const utcFilter = buildTemporalFilter(
    "effective",
    "dateTime",
    parseTemporalQueryValue("2019-12-31T22:00:00Z", "dateTime"),
    "eq"
);

process.stdout.write(JSON.stringify(plain({
    timezoneLessMinute,
    timezoneLessParsed,
    offsetParsed,
    utcParsed,
    offsetFilter,
    utcFilter
})));
`;

        function runInTimezone(timezone) {
            const result = spawnSync(process.execPath, ["-e", CHILD_SCRIPT], {
                cwd: process.cwd(),
                env: { ...process.env, TZ: timezone },
                encoding: "utf8"
            });

            expect(result.status, result.stderr).to.equal(0);
            return JSON.parse(result.stdout);
        }

        it("treats timezone-less dateTime as UTC across process timezones", function () {
            const results = ["UTC", "America/Los_Angeles", "Asia/Tokyo"].map(runInTimezone);
            const expectedStart = String(Date.UTC(2015, 1, 7, 13, 28, 0) / 1000);
            const expectedEnd = String(Date.UTC(2015, 1, 7, 13, 29, 0) / 1000);

            for (const result of results) {
                expect(result.timezoneLessMinute.normalizedStart).to.equal(expectedStart);
                expect(result.timezoneLessMinute.normalizedEnd).to.equal(expectedEnd);
                expect(result.timezoneLessParsed.range.start).to.equal(expectedStart);
                expect(result.timezoneLessParsed.range.end).to.equal(expectedEnd);
                expect(result.offsetParsed.range).to.deep.equal(result.utcParsed.range);
                expect(result.offsetFilter).to.deep.equal(result.utcFilter);
            }

            expect(results[1]).to.deep.equal(results[0]);
            expect(results[2]).to.deep.equal(results[0]);
        });
    });

    describe("precision-specific comparator boundaries", function () {
        it("uses minute interval upper bound for gt2020-02-29T23:59", function () {
            const filter = executeSearchQueryPlan(dateTimePlan(), "gt2020-02-29T23:59", FIELD);
            expect(filter).to.deep.equal({
                [END_FIELD]: { $gt: decimal128(utcEpochSeconds(2020, 3, 1, 0, 0)) }
            });
        });

        it("uses second interval lower bound for lt2020-01-01T00:00:00+02:00", function () {
            const filter = executeSearchQueryPlan(
                dateTimePlan(),
                "lt2020-01-01T00:00:00+02:00",
                FIELD
            );
            expect(filter).to.deep.equal({
                [START_FIELD]: { $lt: decimal128(utcEpochSeconds(2019, 12, 31, 22, 0, 0)) }
            });
        });

        it("uses high-precision fraction interval for sa query", function () {
            const filter = executeSearchQueryPlan(
                dateTimePlan(),
                prefixedValue("sa", HIGH_PRECISION_FRACTION.bareValue),
                FIELD
            );
            expect(filter).to.deep.equal({
                [START_FIELD]: { $gte: decimal128(HIGH_PRECISION_FRACTION.end) }
            });
        });

        it("builds deterministic Decimal128 approximation window for ap minute query", function () {
            const fixture = PRECISION_FIXTURES.find((entry) => entry.precision === "minute");
            const first = executeSearchQueryPlan(
                dateTimePlan(),
                prefixedValue("ap", fixture.bareValue),
                FIELD
            );
            const second = executeSearchQueryPlan(
                dateTimePlan(),
                prefixedValue("ap", fixture.bareValue),
                FIELD
            );
            const approximated = approximateDecimalRange(
                comparisonRange(fixture.start, fixture.end, "eq")
            );

            expect(first).to.deep.equal({
                [START_FIELD]: { $lt: approximated.end },
                [END_FIELD]: { $gt: approximated.start }
            });
            expect(first).to.deep.equal(second);
        });
    });
});
