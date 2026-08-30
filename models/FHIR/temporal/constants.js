const DATE_PRECISION = Object.freeze({
    YEAR: "year",
    MONTH: "month",
    DAY: "day"
});

const DATETIME_PRECISION = Object.freeze({
    YEAR: "year",
    MONTH: "month",
    DAY: "day",
    MINUTE: "minute",
    SECOND: "second",
    FRACTION: "fraction"
});

const INSTANT_PRECISION = Object.freeze({
    SECOND: "second",
    FRACTION: "fraction"
});

const DATE_PATTERN =
    /^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1]))?)?$/;

const DATETIME_PATTERN =
    /^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(?:-(0[1-9]|1[0-2])(?:-(0[1-9]|[1-2][0-9]|3[0-1])(?:T([01][0-9]|2[0-3]):[0-5][0-9](?::([0-5][0-9]|60)(?:\.[0-9]+)?)?(?:Z|(?:\+|-)(?:(?:0[0-9]|1[0-3]):[0-5][0-9]|14:00))?)?)?)?$/;

const INSTANT_PATTERN =
    /^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])T([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\.[0-9]+)?(Z|(\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00))$/;

const CALENDAR_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const DATE_PRECISION_VALUES = Object.freeze(new Set(Object.values(DATE_PRECISION)));
const DATETIME_PRECISION_VALUES = Object.freeze(new Set(Object.values(DATETIME_PRECISION)));
const INSTANT_PRECISION_VALUES = Object.freeze(new Set(Object.values(INSTANT_PRECISION)));

const CANONICAL_DATE_FIELDS = Object.freeze(
    new Set(["value", "precision", "normalizedStart", "normalizedEnd"])
);

const CANONICAL_DATETIME_FIELDS = Object.freeze(
    new Set(["value", "precision", "fractionDigits", "normalizedStart", "normalizedEnd"])
);

const CANONICAL_INSTANT_FIELDS = Object.freeze(
    new Set(["value", "precision", "fractionDigits", "epochSeconds"])
);

module.exports = {
    DATE_PRECISION,
    DATETIME_PRECISION,
    INSTANT_PRECISION,
    DATE_PATTERN,
    DATETIME_PATTERN,
    INSTANT_PATTERN,
    CALENDAR_DATE_PATTERN,
    DATE_PRECISION_VALUES,
    DATETIME_PRECISION_VALUES,
    INSTANT_PRECISION_VALUES,
    CANONICAL_DATE_FIELDS,
    CANONICAL_DATETIME_FIELDS,
    CANONICAL_INSTANT_FIELDS
};
