require("module-alias/register");

const { expect } = require("chai");
const mongoose = require("mongoose");
const {
    buildProjectedFilter
} = require("@models/FHIR/searchParameter/executor/searchTypeProjection");
const {
    buildPeriodTemporalFilter
} = require("@models/FHIR/searchParameter/executor/temporalQueryFilter");
const { parseTemporalQueryValue } = require("@models/FHIR/searchParameter/executor/temporalQueryParser");

function buildPeriodFilter(searchType, value, comparator) {
    const temporal = parseTemporalQueryValue(
        comparator ? `${comparator}${value}` : value,
        searchType
    );
    return buildProjectedFilter(
        searchType,
        temporal.value,
        "effective",
        "Period",
        undefined,
        temporal.comparator,
        undefined,
        undefined,
        temporal
    );
}

function expectMissingBoundary(filter, index, field, objectField, operator, value) {
    const boundary = filter.$and[index];
    expect(boundary).to.have.property("$or").with.lengthOf(2);
    expect(boundary.$or[0][field][operator]).to.be.instanceOf(
        mongoose.Types.Decimal128
    );
    expect(boundary.$or[0][field][operator].toString()).to.equal(value);
    expect(boundary.$or[1]).to.deep.equal({
        [objectField]: { $exists: false }
    });
}

describe("Period temporal projection", function () {
    it("projects a complete Period as one containing interval", function () {
        const filter = buildPeriodFilter("date", "2015");

        expect(filter).to.have.property("$and").with.lengthOf(3);
        expectMissingBoundary(
            filter,
            0,
            "effective.start.normalizedStart",
            "effective.start",
            "$lte",
            "1420070400"
        );
        expectMissingBoundary(
            filter,
            1,
            "effective.end.normalizedEnd",
            "effective.end",
            "$gte",
            "1451606400"
        );
        expect(filter).to.not.have.property("effective.start");
        expect(filter).to.not.have.property("effective.end");
    });

    it("uses missing endpoint branches for open-ended Periods", function () {
        const filter = buildPeriodFilter("dateTime", "2015-02-07T13:28:17+02:00");

        expectMissingBoundary(
            filter,
            0,
            "effective.start.normalizedStart",
            "effective.start",
            "$lte",
            "1423308497"
        );
        expectMissingBoundary(
            filter,
            1,
            "effective.end.normalizedEnd",
            "effective.end",
            "$gte",
            "1423308498"
        );
    });

    it("keeps both infinite boundaries in the same interval filter", function () {
        const filter = buildPeriodFilter("date", "2015");
        const serialized = JSON.stringify(filter);

        expect(serialized.match(/"effective\.start"/g)).to.have.lengthOf(2);
        expect(serialized.match(/"effective\.end"/g)).to.have.lengthOf(2);
        expect(filter.$or).to.equal(undefined);
        expect(filter.$and).to.have.lengthOf(3);
    });

    it("uses strict half-open intersection for approximate Period searches", function () {
        const temporal = parseTemporalQueryValue("ap2015", "date");
        const filter = buildPeriodTemporalFilter("effective", temporal, "ap");

        expect(filter).to.have.property("$and").with.lengthOf(3);
        expectMissingBoundary(
            filter,
            0,
            "effective.start.normalizedStart",
            "effective.start",
            "$lt",
            "1454760000"
        );
        expectMissingBoundary(
            filter,
            1,
            "effective.end.normalizedEnd",
            "effective.end",
            "$gt",
            "1416916800"
        );
    });

    it("does not build independent endpoint OR branches", function () {
        const filter = buildPeriodFilter("date", "2015", "eq");

        expect(filter).to.deep.include({
            $and: [
                {
                    $or: [
                        {
                            "effective.start.normalizedStart": {
                                $lte: mongoose.Types.Decimal128.fromString("1420070400")
                            }
                        },
                        { "effective.start": { $exists: false } }
                    ]
                },
                {
                    $or: [
                        {
                            "effective.end.normalizedEnd": {
                                $gte: mongoose.Types.Decimal128.fromString("1451606400")
                            }
                        },
                        { "effective.end": { $exists: false } }
                    ]
                },
                {
                    $or: [
                        { "effective.start": { $exists: true } },
                        { "effective.end": { $exists: true } }
                    ]
                }
            ]
        });
    });
});
