require("module-alias/register");

const { expect } = require("chai");
const { spawnSync } = require("child_process");
const {
    buildPrimitiveFilter
} = require("@models/FHIR/searchParameter/executor/primitives");

const CHILD_SCRIPT = `
require("module-alias/register");

const { buildPrimitiveFilter } = require("./models/FHIR/searchParameter/executor/primitives");
const { parseTemporalQueryValue } = require("./models/FHIR/searchParameter/executor/temporalQueryParser");
const {
    buildProjectedFilter
} = require("./models/FHIR/searchParameter/executor/searchTypeProjection");

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

const dateTimeOffset = buildPrimitiveFilter(
    "dateTime",
    "2020-01-01T00:00:00+02:00",
    "effective"
);
const dateTimeUtc = buildPrimitiveFilter(
    "dateTime",
    "2019-12-31T22:00:00Z",
    "effective"
);
const dateTimeGreaterThanUtc = buildPrimitiveFilter(
    "dateTime",
    "2019-12-31T22:00:00Z",
    "effective",
    undefined,
    "gt"
);
const dateTimeGreaterThan = buildPrimitiveFilter(
    "dateTime",
    "2020-01-01T00:00:00+02:00",
    "effective",
    undefined,
    "gt"
);
const dateCalendar = buildPrimitiveFilter("date", "2020-02", "effective", undefined, "gt");
const dateCalendarPrefixed = buildPrimitiveFilter("date", "gt2020-02", "effective");
const instant = buildPrimitiveFilter(
    "instant",
    "2020-01-01T00:00:00.123456789012345678Z",
    "effective"
);
const token = buildPrimitiveFilter("token", "active", "status");
const projectionFallback = buildProjectedFilter(
    "dateTime",
    "2020-01-01T00:00:00+02:00",
    "effective",
    "dateTime"
);
const dateTimeParsedOffset = parseTemporalQueryValue(
    "2020-01-01T00:00:00+02:00",
    "dateTime"
);
const dateTimeParsedUtc = parseTemporalQueryValue(
    "2019-12-31T22:00:00Z",
    "dateTime"
);
const dateParsed = parseTemporalQueryValue("2020-02", "date");
const instantParsed = parseTemporalQueryValue(
    "2020-01-01T00:00:00.123456789012345678Z",
    "instant"
);

process.stdout.write(JSON.stringify(plain({
    dateTimeOffset,
    dateTimeUtc,
    dateTimeGreaterThan,
    dateTimeGreaterThanUtc,
    dateCalendar,
    dateCalendarPrefixed,
    instant,
    token,
    projectionFallback,
    dateTimeParsedOffset,
    dateTimeParsedUtc,
    dateParsed,
    instantParsed
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

describe("temporal query timezone determinism", function () {
    it("uses canonical UTC and Decimal128 values across process timezones", function () {
        const results = ["UTC", "America/Los_Angeles", "Asia/Tokyo"].map(runInTimezone);

        for (const result of results) {
            expect(result.dateTimeParsedOffset.range).to.deep.equal(
                result.dateTimeParsedUtc.range
            );
            expect(result.dateTimeParsedOffset.range).to.deep.equal({
                kind: "dateTime",
                start: "1577829600",
                end: "1577829601"
            });
            expect(result.dateParsed.range).to.deep.equal({
                kind: "date",
                start: "2020-02-01",
                end: "2020-03-01"
            });
            expect(result.dateTimeOffset).to.deep.equal(result.dateTimeUtc);
            expect(result.projectionFallback).to.deep.equal(result.dateTimeOffset);
            expect(result.dateTimeGreaterThan).to.deep.equal(
                result.dateTimeGreaterThanUtc
            );
            expect(result.dateTimeOffset).to.deep.equal({
                "effective.normalizedStart": { $gte: "1577829600" },
                "effective.normalizedEnd": { $lte: "1577829601" }
            });
            expect(result.dateTimeGreaterThan).to.deep.equal({
                "effective.normalizedEnd": { $gt: "1577829601" }
            });
            expect(result.dateCalendar).to.deep.equal({
                "effective.normalizedEnd": { $gt: "2020-03-01" }
            });
            expect(result.dateCalendarPrefixed).to.deep.equal(result.dateCalendar);
        }

        expect(results[1]).to.deep.equal(results[0]);
        expect(results[2]).to.deep.equal(results[0]);
    });

    it("preserves high-precision instant ordering and non-temporal behavior", function () {
        const result = runInTimezone("America/Los_Angeles");

        expect(result.instant).to.deep.equal({
            "effective.epochSeconds": { $eq: "1577836800.123456789012345678" }
        });
        expect(result.instantParsed.epochSeconds).to.equal(
            "1577836800.123456789012345678"
        );
        expect(result.token).to.deep.equal({ status: "active" });
    });
});
