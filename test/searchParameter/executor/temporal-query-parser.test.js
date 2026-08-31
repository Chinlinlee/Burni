require("module-alias/register");

const { expect } = require("chai");
const {
    parseTemporalQueryValue,
    parseSearchValue,
    validateAndBuildFilter
} = require("@models/FHIR/searchParameter/executor/queryValueParser");
const { TEMPORAL_ERROR_CODE } = require("@models/FHIR/temporal");

describe("FHIR temporal search value parser", function () {
    it("preserves date year, month, and day precision", function () {
        expect(parseTemporalQueryValue("9999", "date")).to.include({
            value: "9999",
            kind: "date",
            precision: "year"
        });
        expect(parseTemporalQueryValue("eq1995", "date")).to.include({
            rawValue: "eq1995",
            value: "1995",
            kind: "date",
            precision: "year",
            comparator: "eq"
        });
        expect(parseTemporalQueryValue("1995-06", "date")).to.include({
            rawValue: "1995-06",
            value: "1995-06",
            kind: "date",
            precision: "month"
        });
        expect(parseTemporalQueryValue("le1995-06-15", "date")).to.include({
            rawValue: "le1995-06-15",
            value: "1995-06-15",
            kind: "date",
            precision: "day",
            comparator: "le"
        });
    });

    it("parses every dateTime precision and keeps comparator prefixes", function () {
        const values = [
            ["gt2015", "year", "gt"],
            ["2015-02", "month", undefined],
            ["ge2015-02-07", "day", "ge"],
            ["2015-02-07T13:28+02:00", "minute", undefined],
            ["lt2015-02-07T13:28:17Z", "second", "lt"],
            ["2015-02-07T13:28:17.2300+02:00", "fraction", undefined]
        ];

        for (const [rawValue, precision, comparator] of values) {
            const parsed = parseTemporalQueryValue(rawValue, "dateTime");
            expect(parsed).to.include({
                rawValue,
                value: comparator ? rawValue.slice(comparator.length) : rawValue,
                kind: "dateTime",
                precision
            });
            expect(parsed.comparator).to.equal(comparator);
        }

        expect(
            parseTemporalQueryValue(
                "2015-02-07T13:28:17.2300+02:00",
                "dateTime"
            ).fractionDigits
        ).to.equal(4);
    });

    it("parses instant second and fraction precision with UTC normalization policy", function () {
        expect(parseTemporalQueryValue("2015-02-07T13:28:17Z", "instant")).to.include({
            rawValue: "2015-02-07T13:28:17Z",
            value: "2015-02-07T13:28:17Z",
            kind: "instant",
            precision: "second"
        });
        expect(
            parseTemporalQueryValue(
                "2015-02-07T13:28:17.230456789+02:00",
                "instant"
            )
        ).to.include({
            kind: "instant",
            precision: "fraction",
            fractionDigits: 9
        });
    });

    it("attaches typed values to parsed search tokens", function () {
        const parsed = parseSearchValue(
            "ap2015-02-07T13:28:17.2300+02:00",
            "effective",
            "dateTime"
        );
        const token = parsed.groups[0][0];

        expect(token).to.include({
            value: "2015-02-07T13:28:17.2300+02:00",
            comparator: "ap"
        });
        expect(token.temporal).to.include({
            kind: "dateTime",
            precision: "fraction",
            fractionDigits: 4
        });
        expect(parsed.errors).to.deep.equal([]);
    });

    it("reports invalid temporal values through query validation", function () {
        const parsed = parseSearchValue("2020-02-30", "birthDate", "date");
        expect(parsed.errors).to.have.lengthOf(1);
        expect(parsed.errors[0].message).to.match(/calendar date|Invalid FHIR date/);

        const result = validateAndBuildFilter(
            {
                estimatedCost: 1,
                searchType: "dateTime",
                code: "effective",
                extractionPaths: [
                    { path: "effectiveDateTime", datatype: "dateTime" }
                ],
                comparators: ["eq"]
            },
            "2020-02-07T13",
            "effective"
        );
        expect(result.valid).to.equal(false);
        expect(result.reason).to.match(/Invalid FHIR dateTime|precision|value/);
    });

    it("rejects instant values without a timezone", function () {
        expect(() =>
            parseTemporalQueryValue("2015-02-07T13:28:17", "instant")
        ).to.throw().with.property("code", TEMPORAL_ERROR_CODE.MISSING_INSTANT_TIMEZONE);
    });
});
