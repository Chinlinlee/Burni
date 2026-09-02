require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const {
    buildTemporalSearchFilter,
    parseTemporalQueryValue
} = require("@models/FHIR/searchParameter/executor/temporalQuery");

describe("temporal query seam", function () {
    describe("buildTemporalSearchFilter", function () {
        it("builds date range filters for eq comparator", function () {
            const filter = buildTemporalSearchFilter("effective", "date", "2020-02");

            expect(filter).to.deep.equal({
                "effective.normalizedStart": { $gte: "2020-02-01" },
                "effective.normalizedEnd": { $lte: "2020-03-01" }
            });
        });

        it("builds dateTime Decimal128 range filters", function () {
            const filter = buildTemporalSearchFilter(
                "effective",
                "dateTime",
                "2020-01-01T00:00:00Z"
            );

            expect(filter["effective.normalizedStart"].$gte).to.be.instanceOf(
                mongoose.Types.Decimal128
            );
            expect(filter["effective.normalizedStart"].$gte.toString()).to.equal("1577836800");
            expect(filter["effective.normalizedEnd"].$lte.toString()).to.equal("1577836801");
        });

        it("builds instant point filters", function () {
            const filter = buildTemporalSearchFilter(
                "effective",
                "instant",
                "2015-02-07T13:28:17Z"
            );

            expect(filter["effective.epochSeconds"].$eq).to.be.instanceOf(
                mongoose.Types.Decimal128
            );
            expect(filter["effective.epochSeconds"].$eq.toString()).to.equal("1423315697");
        });

        it("builds Period containment filters", function () {
            const filter = buildTemporalSearchFilter("effective", "Period", "2015");

            expect(filter).to.have.property("$and").with.lengthOf(3);
            expect(filter.$and[0]).to.have.property("$or").with.lengthOf(2);
            expect(filter.$and[0].$or[0]["effective.start.normalizedStart"].$lte.toString()).to.equal(
                "1420070400"
            );
            expect(filter.$and[1].$or[0]["effective.end.normalizedEnd"].$gte.toString()).to.equal(
                "1451606400"
            );
        });

        it("applies ap comparator with calendar approximation for date", function () {
            const filter = buildTemporalSearchFilter("effective", "date", "ap2020-02-29");

            expect(filter).to.deep.equal({
                "effective.normalizedStart": { $lt: "2020-03-02" },
                "effective.normalizedEnd": { $gt: "2020-02-28" }
            });
        });

        it("wraps filters in $elemMatch when arrayPaths are provided", function () {
            const filter = buildTemporalSearchFilter("events.start", "date", "2020-02", {
                arrayPaths: ["events"]
            });

            expect(filter).to.have.nested.property("events.$elemMatch");
            expect(filter.events.$elemMatch).to.deep.equal({
                "start.normalizedStart": { $gte: "2020-02-01" },
                "start.normalizedEnd": { $lte: "2020-03-01" }
            });
        });

        it("accepts pre-parsed temporal via options", function () {
            const temporal = parseTemporalQueryValue("2020-02", "date");
            const filter = buildTemporalSearchFilter("effective", "date", "2020-02", {
                temporal
            });

            expect(filter).to.deep.equal({
                "effective.normalizedStart": { $gte: "2020-02-01" },
                "effective.normalizedEnd": { $lte: "2020-03-01" }
            });
        });

        it("prefers explicit comparator over value prefix", function () {
            const filter = buildTemporalSearchFilter("effective", "date", "gt2020-02", {
                comparator: "lt"
            });

            expect(filter).to.deep.equal({
                "effective.normalizedStart": { $lt: "2020-02-01" }
            });
        });
    });
});
