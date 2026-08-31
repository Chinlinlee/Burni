require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const {
    parseTemporalQueryValue,
    normalizeTemporalQueryRange
} = require("@models/FHIR/searchParameter/executor/temporalQueryParser");
const { validateAndBuildFilter } = require("@models/FHIR/searchParameter/executor/queryValueParser");
const { executeSearchQueryPlan } = require("@models/FHIR/searchParameter/executor/mongoExecutor");
const { buildTemporalFilter } = require("@models/FHIR/searchParameter/executor/temporalQueryFilter");

describe("FHIR temporal query range normalization", function () {
    function datePlan(datatype = "date") {
        return {
            estimatedCost: 1,
            searchType: "date",
            code: "effective",
            extractionPaths: [{ path: "effective", datatype }],
            comparators: ["eq", "ne", "lt", "gt", "ge", "le", "sa", "eb", "ap"]
        };
    }

    function dateTimePlan() {
        return {
            estimatedCost: 1,
            searchType: "dateTime",
            code: "effective",
            extractionPaths: [{ path: "effective", datatype: "dateTime" }],
            comparators: ["eq", "ne", "lt", "gt", "ge", "le", "sa", "eb", "ap"]
        };
    }

    describe("date", function () {
        it("builds half-open year, month, and day calendar ranges", function () {
            expect(parseTemporalQueryValue("1995", "date").range).to.deep.equal({
                kind: "date",
                start: "1995-01-01",
                end: "1996-01-01"
            });
            expect(parseTemporalQueryValue("9999", "date").range.end).to.equal(
                "9999-12-31"
            );
            const leapMonth = parseTemporalQueryValue("2020-02", "date");
            expect(leapMonth.range).to.deep.equal({
                kind: "date",
                start: "2020-02-01",
                end: "2020-03-01"
            });
            expect(leapMonth.queryStart).to.equal("2020-02-01");
            expect(leapMonth.queryEnd).to.equal("2020-03-01");
            expect(parseTemporalQueryValue("2020-02-29", "date").range).to.deep.equal({
                kind: "date",
                start: "2020-02-29",
                end: "2020-03-01"
            });
            expect(parseTemporalQueryValue("2020-12", "date").range).to.deep.equal({
                kind: "date",
                start: "2020-12-01",
                end: "2021-01-01"
            });
        });

        it("keeps comparator boundaries independent from lexical precision", function () {
            const greaterThanMonth = parseTemporalQueryValue("gt1995-06", "date");
            const lessThanYear = parseTemporalQueryValue("lt1995", "date");

            expect(greaterThanMonth.comparator).to.equal("gt");
            expect(greaterThanMonth.range.end).to.equal("1995-07-01");
            expect(lessThanYear.comparator).to.equal("lt");
            expect(lessThanYear.range.start).to.equal("1995-01-01");
        });
    });

    describe("dateTime", function () {
        it("builds UTC Decimal128 calendar ranges for year, month, and day", function () {
            const cases = [
                ["2020", Date.UTC(2020, 0, 1) / 1000, Date.UTC(2021, 0, 1) / 1000],
                ["2020-02", Date.UTC(2020, 1, 1) / 1000, Date.UTC(2020, 2, 1) / 1000],
                [
                    "2020-02-29",
                    Date.UTC(2020, 1, 29) / 1000,
                    Date.UTC(2020, 2, 1) / 1000
                ]
            ];

            for (const [value, start, end] of cases) {
                const range = parseTemporalQueryValue(value, "dateTime").range;
                expect(range.kind).to.equal("dateTime");
                expect(range.start).to.be.instanceOf(mongoose.Types.Decimal128);
                expect(range.end).to.be.instanceOf(mongoose.Types.Decimal128);
                expect(range.start.toString()).to.equal(String(start));
                expect(range.end.toString()).to.equal(String(end));
            }
        });

        it("builds minute, second, and fraction ranges with UTC and offsets", function () {
            const utcMinute = parseTemporalQueryValue(
                "2020-02-29T23:59Z",
                "dateTime"
            ).range;
            expect(utcMinute.start.toString()).to.equal(
                String(Date.UTC(2020, 1, 29, 23, 59) / 1000)
            );
            expect(utcMinute.end.toString()).to.equal(
                String(Date.UTC(2020, 2, 1, 0, 0) / 1000)
            );

            const offsetSecond = parseTemporalQueryValue(
                "2020-01-01T00:00:00+02:00",
                "dateTime"
            ).range;
            expect(offsetSecond.start.toString()).to.equal(
                String(Date.UTC(2019, 11, 31, 22, 0, 0) / 1000)
            );
            expect(offsetSecond.end.toString()).to.equal(
                String(Date.UTC(2019, 11, 31, 22, 0, 1) / 1000)
            );

            const fraction = parseTemporalQueryValue(
                "2020-01-01T00:00:00.123400-02:00",
                "dateTime"
            );
            expect(fraction.range.start.toString()).to.equal("1577844000.123400");
            expect(fraction.range.end.toString()).to.equal("1577844000.123401");
        });

        it("preserves high precision fractional Decimal128 boundaries", function () {
            const value = "2020-01-01T00:00:00.123456789012345678+00:00";
            const range = normalizeTemporalQueryRange(value, "dateTime");

            expect(range.start).to.be.instanceOf(mongoose.Types.Decimal128);
            expect(range.start.toString()).to.equal("1577836800.123456789012345678");
            expect(range.end.toString()).to.equal("1577836800.123456789012345679");
        });
    });

    describe("FHIR R4 range comparators", function () {
        it("uses containment, overlap, and half-open boundary semantics", function () {
            const values = {
                eq: executeSearchQueryPlan(datePlan(), "eq2020-02", "effective"),
                ne: executeSearchQueryPlan(datePlan(), "ne2020-02", "effective"),
                lt: executeSearchQueryPlan(datePlan(), "lt2020-02", "effective"),
                gt: executeSearchQueryPlan(datePlan(), "gt2020-02", "effective"),
                ge: executeSearchQueryPlan(datePlan(), "ge2020-02", "effective"),
                le: executeSearchQueryPlan(datePlan(), "le2020-02", "effective"),
                sa: executeSearchQueryPlan(datePlan(), "sa2020-02", "effective"),
                eb: executeSearchQueryPlan(datePlan(), "eb2020-02", "effective")
            };

            expect(values.eq).to.deep.equal({
                "effective.normalizedStart": { $gte: "2020-02-01" },
                "effective.normalizedEnd": { $lte: "2020-03-01" }
            });
            expect(values.ne.$nor).to.deep.equal([values.eq]);
            expect(values.lt).to.deep.equal({
                "effective.normalizedStart": { $lt: "2020-02-01" }
            });
            expect(values.gt).to.deep.equal({
                "effective.normalizedEnd": { $gt: "2020-03-01" }
            });
            expect(values.ge.$or).to.deep.equal([values.gt, values.eq]);
            expect(values.le.$or).to.deep.equal([values.lt, values.eq]);
            expect(values.sa).to.deep.equal({
                "effective.normalizedStart": { $gte: "2020-03-01" }
            });
            expect(values.eb).to.deep.equal({
                "effective.normalizedEnd": { $lte: "2020-02-01" }
            });
        });

        it("keeps partial precision boundaries in comparator filters", function () {
            const filter = executeSearchQueryPlan(datePlan(), "gt1995-06", "effective");
            expect(filter).to.deep.equal({
                "effective.normalizedEnd": { $gt: "1995-07-01" }
            });
        });

        it("uses Decimal128 normalized fields for dateTime targets", function () {
            const filter = executeSearchQueryPlan(
                dateTimePlan(),
                "ge2020-01-01T00:00:00.123456789Z",
                "effective"
            );

            expect(filter.$or[0]["effective.normalizedEnd"].$gt).to.be.instanceOf(
                mongoose.Types.Decimal128
            );
            expect(filter.$or[1]["effective.normalizedStart"].$gte).to.be.instanceOf(
                mongoose.Types.Decimal128
            );
            expect(filter.$or[1]["effective.normalizedStart"].$gte.toString()).to.equal(
                "1577836800.123456789"
            );
        });

        it("builds a deterministic 10 percent calendar approximation window", function () {
            const first = executeSearchQueryPlan(datePlan(), "ap2020-02-29", "effective");
            const second = executeSearchQueryPlan(datePlan(), "ap2020-02-29", "effective");

            expect(first).to.deep.equal({
                "effective.normalizedStart": { $lt: "2020-03-02" },
                "effective.normalizedEnd": { $gt: "2020-02-28" }
            });
            expect(first).to.deep.equal(second);
        });

        it("builds a deterministic Decimal128 approximation window", function () {
            const temporal = parseTemporalQueryValue(
                "ap2020-01-01T00:00:00Z",
                "dateTime"
            );
            const filter = buildTemporalFilter("effective", "dateTime", temporal, "ap");

            expect(filter["effective.normalizedStart"].$lt.toString()).to.equal("1577836801.1");
            expect(filter["effective.normalizedEnd"].$gt.toString()).to.equal("1577836799.9");
        });

        it("rejects invalid temporal values and undeclared comparators", function () {
            const invalid = validateAndBuildFilter(datePlan(), "xx2020-02", "effective");
            expect(invalid.valid).to.equal(false);

            const undeclared = validateAndBuildFilter(
                { ...datePlan(), comparators: ["eq"] },
                "sa2020-02",
                "effective"
            );
            expect(undeclared.valid).to.equal(false);
        });
    });

    it("rejects invalid calendar input before producing a range", function () {
        expect(() => normalizeTemporalQueryRange("2021-02-29", "date")).to.throw(
            /calendar date|Invalid FHIR date/
        );
        expect(() =>
            normalizeTemporalQueryRange("2020-02-30T12:00:00Z", "dateTime")
        ).to.throw(/calendar date|Invalid FHIR dateTime/);
    });
});
