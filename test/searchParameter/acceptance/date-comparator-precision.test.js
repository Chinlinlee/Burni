require("module-alias/register");

const { expect } = require("chai");
const { parseTemporalQueryValue } = require("@models/FHIR/searchParameter/executor/temporalQueryParser");
const {
    buildTemporalFilter,
    buildRangeFilter,
    approximateCalendarRange
} = require("@models/FHIR/searchParameter/executor/temporalQueryFilter");
const { executeSearchQueryPlan } = require("@models/FHIR/searchParameter/executor/mongoExecutor");

describe("date comparator precision acceptance", function () {
    const FIELD = "effective";
    const COMPARATORS = ["eq", "ne", "lt", "gt", "ge", "le", "sa", "eb", "ap"];
    const START_FIELD = `${FIELD}.normalizedStart`;
    const END_FIELD = `${FIELD}.normalizedEnd`;

    const PRECISION_FIXTURES = [
        {
            precision: "year",
            bareValue: "1995",
            start: "1995-01-01",
            end: "1996-01-01"
        },
        {
            precision: "month",
            bareValue: "2020-02",
            start: "2020-02-01",
            end: "2020-03-01"
        },
        {
            precision: "day",
            bareValue: "1995-06-15",
            start: "1995-06-15",
            end: "1995-06-16"
        }
    ];

    function datePlan() {
        return {
            estimatedCost: 1,
            searchType: "date",
            code: "effective",
            extractionPaths: [{ path: FIELD, datatype: "date" }],
            comparators: COMPARATORS
        };
    }

    function comparisonRange(start, end, comparator) {
        const range = { kind: "date", start, end };
        if (comparator === "ap") {
            return approximateCalendarRange(range);
        }
        return range;
    }

    function expectedFilter(start, end, comparator) {
        return buildRangeFilter(
            START_FIELD,
            END_FIELD,
            comparisonRange(start, end, comparator),
            comparator
        );
    }

    function prefixedValue(comparator, bareValue) {
        return `${comparator}${bareValue}`;
    }

    describe("parseTemporalQueryValue", function () {
        for (const fixture of PRECISION_FIXTURES) {
            it(`preserves ${fixture.precision} precision and [start, end) range`, function () {
                const parsed = parseTemporalQueryValue(fixture.bareValue, "date");
                expect(parsed).to.include({
                    rawValue: fixture.bareValue,
                    value: fixture.bareValue,
                    kind: "date",
                    precision: fixture.precision
                });
                expect(parsed.range).to.deep.equal({
                    kind: "date",
                    start: fixture.start,
                    end: fixture.end
                });
                expect(parsed.queryStart).to.equal(fixture.start);
                expect(parsed.queryEnd).to.equal(fixture.end);
            });
        }

        it("keeps comparator prefixes for every declared comparator across precisions", function () {
            for (const fixture of PRECISION_FIXTURES) {
                for (const comparator of COMPARATORS) {
                    const rawValue = prefixedValue(comparator, fixture.bareValue);
                    const parsed = parseTemporalQueryValue(rawValue, "date");
                    expect(parsed).to.include({
                        rawValue,
                        value: fixture.bareValue,
                        kind: "date",
                        precision: fixture.precision,
                        comparator
                    });
                    expect(parsed.range).to.deep.equal({
                        kind: "date",
                        start: fixture.start,
                        end: fixture.end
                    });
                }
            }
        });
    });

    describe("buildTemporalFilter", function () {
        for (const fixture of PRECISION_FIXTURES) {
            for (const comparator of COMPARATORS) {
                it(`builds ${comparator} filter for ${fixture.precision} precision`, function () {
                    const rawValue = prefixedValue(comparator, fixture.bareValue);
                    const temporal = parseTemporalQueryValue(rawValue, "date");
                    const filter = buildTemporalFilter(FIELD, "date", temporal, comparator);
                    expect(filter).to.deep.equal(
                        expectedFilter(fixture.start, fixture.end, comparator)
                    );
                });
            }
        }
    });

    describe("executeSearchQueryPlan", function () {
        for (const fixture of PRECISION_FIXTURES) {
            for (const comparator of COMPARATORS) {
                it(`executes ${comparator} plan for ${fixture.precision} precision`, function () {
                    const rawValue = prefixedValue(comparator, fixture.bareValue);
                    const filter = executeSearchQueryPlan(datePlan(), rawValue, "effective");
                    expect(filter).to.deep.equal(
                        expectedFilter(fixture.start, fixture.end, comparator)
                    );
                });
            }
        }
    });

    describe("precision-specific comparator boundaries", function () {
        it("uses year interval upper bound for gt1995", function () {
            const filter = executeSearchQueryPlan(datePlan(), "gt1995", "effective");
            expect(filter).to.deep.equal({
                [END_FIELD]: { $gt: "1996-01-01" }
            });
        });

        it("uses month interval lower bound for lt2020-02", function () {
            const filter = executeSearchQueryPlan(datePlan(), "lt2020-02", "effective");
            expect(filter).to.deep.equal({
                [START_FIELD]: { $lt: "2020-02-01" }
            });
        });

        it("uses day interval for sa1995-06-15", function () {
            const filter = executeSearchQueryPlan(datePlan(), "sa1995-06-15", "effective");
            expect(filter).to.deep.equal({
                [START_FIELD]: { $gte: "1995-06-16" }
            });
        });

        it("uses deterministic year approximation window for ap1995", function () {
            const first = executeSearchQueryPlan(datePlan(), "ap1995", "effective");
            const second = executeSearchQueryPlan(datePlan(), "ap1995", "effective");
            const approximated = approximateCalendarRange({
                kind: "date",
                start: "1995-01-01",
                end: "1996-01-01"
            });

            expect(first).to.deep.equal({
                [START_FIELD]: { $lt: approximated.end },
                [END_FIELD]: { $gt: approximated.start }
            });
            expect(first).to.deep.equal(second);
        });

        it("uses deterministic month approximation window for ap2020-02", function () {
            const filter = executeSearchQueryPlan(datePlan(), "ap2020-02", "effective");
            expect(filter).to.deep.equal({
                [START_FIELD]: { $lt: "2020-03-04" },
                [END_FIELD]: { $gt: "2020-01-29" }
            });
        });

        it("uses deterministic day approximation window for ap1995-06-15", function () {
            const filter = executeSearchQueryPlan(datePlan(), "ap1995-06-15", "effective");
            expect(filter).to.deep.equal({
                [START_FIELD]: { $lt: "1995-06-17" },
                [END_FIELD]: { $gt: "1995-06-14" }
            });
        });
    });
});
