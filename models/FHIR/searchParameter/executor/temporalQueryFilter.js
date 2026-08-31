const { calendarDateToUtcEpoch } = require("../../temporal/epoch");
const mongoose = require("mongoose");
const { buildInstantQuery } = require("./instantQueryBuilder");

const APPROXIMATION_RATIO = 0.1;
const CALENDAR_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * @param {string} value
 * @returns {{ numerator: bigint, scale: number }}
 */
function parseDecimal(value) {
    const text = String(value);
    const sign = text.startsWith("-") ? -1n : 1n;
    const unsigned = text.startsWith("-") || text.startsWith("+") ? text.slice(1) : text;
    const [integer = "0", fraction = ""] = unsigned.split(".");
    const digits = `${integer}${fraction}`.replace(/^0+(?=\d)/, "") || "0";
    return {
        numerator: sign * BigInt(digits),
        scale: fraction.length
    };
}

/**
 * @param {bigint} numerator
 * @param {number} scale
 * @returns {string}
 */
function formatDecimal(numerator, scale) {
    if (numerator === 0n) {
        return "0";
    }

    const sign = numerator < 0n ? "-" : "";
    const digits = (numerator < 0n ? -numerator : numerator).toString().padStart(scale + 1, "0");
    if (scale === 0) {
        return `${sign}${digits}`;
    }

    const integer = digits.slice(0, -scale) || "0";
    const fraction = digits.slice(-scale).replace(/0+$/, "");
    return fraction ? `${sign}${integer}.${fraction}` : `${sign}${integer}`;
}

/**
 * @param {string} left
 * @param {string} right
 * @param {1 | -1} rightSign
 * @returns {string}
 */
function addDecimal(left, right, rightSign) {
    const leftParts = parseDecimal(left);
    const rightParts = parseDecimal(right);
    const scale = Math.max(leftParts.scale, rightParts.scale);
    const leftScaled = leftParts.numerator * 10n ** BigInt(scale - leftParts.scale);
    const rightScaled = rightParts.numerator * 10n ** BigInt(scale - rightParts.scale);
    return formatDecimal(leftScaled + BigInt(rightSign) * rightScaled, scale);
}

/**
 * @param {string} value
 * @returns {string}
 */
function divideDecimalByTen(value) {
    const parts = parseDecimal(value);
    return formatDecimal(parts.numerator, parts.scale + 1);
}

/**
 * @param {string} value
 * @returns {{ year: number, month: number, day: number }}
 */
function parseCalendarDate(value) {
    const [year, month, day] = String(value).split("-").map(Number);
    return { year, month, day };
}

/**
 * @param {string} value
 * @returns {number}
 */
function calendarDateToMilliseconds(value) {
    const { year, month, day } = parseCalendarDate(value);
    const date = new Date(0);
    date.setUTCFullYear(year, month - 1, day);
    date.setUTCHours(0, 0, 0, 0);
    return date.getTime();
}

/**
 * @param {number} milliseconds
 * @returns {string}
 */
function millisecondsToCalendarDate(milliseconds) {
    const date = new Date(milliseconds);
    return [
        String(date.getUTCFullYear()).padStart(4, "0"),
        String(date.getUTCMonth() + 1).padStart(2, "0"),
        String(date.getUTCDate()).padStart(2, "0")
    ].join("-");
}

/**
 * @param {string} value
 * @param {number} days
 * @returns {string}
 */
function shiftCalendarDate(value, days) {
    return millisecondsToCalendarDate(calendarDateToMilliseconds(value) + days * CALENDAR_DAY_MS);
}

/**
 * @param {{ start: string, end: string }}
 * @returns {{ kind: 'date', start: string, end: string }}
 */
function approximateCalendarRange(range) {
    const durationDays = Math.round(
        (calendarDateToMilliseconds(range.end) - calendarDateToMilliseconds(range.start)) /
            CALENDAR_DAY_MS
    );
    const days = Math.max(1, Math.ceil(durationDays * APPROXIMATION_RATIO));
    return {
        kind: "date",
        start: shiftCalendarDate(range.start, -days),
        end: shiftCalendarDate(range.end, days)
    };
}

/**
 * @param {{ start: import('mongoose').Types.Decimal128, end: import('mongoose').Types.Decimal128 }}
 * @returns {{ start: import('mongoose').Types.Decimal128, end: import('mongoose').Types.Decimal128 }}
 */
function approximateDecimalRange(range) {
    const width = addDecimal(range.end.toString(), range.start.toString(), -1);
    const delta = divideDecimalByTen(width);
    return {
        start: mongoose.Types.Decimal128.fromString(
            addDecimal(range.start.toString(), delta, -1)
        ),
        end: mongoose.Types.Decimal128.fromString(addDecimal(range.end.toString(), delta, 1))
    };
}

/**
 * @param {{ kind: 'date', start: string, end: string } | {
 *   kind: 'dateTime',
 *   start: import('mongoose').Types.Decimal128,
 *   end: import('mongoose').Types.Decimal128
 * }} range
 * @param {string | undefined} comparator
 * @returns {typeof range}
 */
function getComparisonRange(range, comparator) {
    if (comparator !== "ap") {
        return range;
    }
    if (range.kind === "date") {
        return approximateCalendarRange(range);
    }
    return {
        kind: "dateTime",
        ...approximateDecimalRange(range)
    };
}

/**
 * @param {{ kind: 'date', start: string, end: string } | {
 *   kind: 'dateTime',
 *   start: import('mongoose').Types.Decimal128,
 *   end: import('mongoose').Types.Decimal128
 * }} queryRange
 * @param {'date' | 'dateTime' | 'instant'} targetDatatype
 * @returns {{ kind: 'date', start: string, end: string } | {
 *   kind: 'dateTime',
 *   start: import('mongoose').Types.Decimal128,
 *   end: import('mongoose').Types.Decimal128
 * }}
 */
function getTargetQueryRange(queryRange, targetDatatype) {
    if (queryRange.kind === "date" && targetDatatype === "date") {
        return queryRange;
    }

    if (queryRange.kind === "dateTime" && targetDatatype === "date") {
        throw new Error("dateTime query cannot target a canonical date field");
    }

    if (queryRange.kind === "date") {
        return {
            kind: "dateTime",
            start: calendarDateToUtcEpoch(queryRange.start),
            end: calendarDateToUtcEpoch(queryRange.end)
        };
    }
    return queryRange;
}

/**
 * @param {string} fieldPath
 * @param {string} datatype
 * @returns {{ startField: string, endField: string } | { pointField: string }}
 */
function getTemporalProjection(fieldPath, datatype) {
    if (typeof fieldPath !== "string" || fieldPath.length === 0) {
        throw new Error("Temporal projection requires a non-empty extraction path");
    }
    if (datatype === "date" || datatype === "dateTime") {
        return {
            startField: `${fieldPath}.normalizedStart`,
            endField: `${fieldPath}.normalizedEnd`
        };
    }
    if (datatype === "instant") {
        return {
            pointField: `${fieldPath}.epochSeconds`
        };
    }
    throw new Error(`Unsupported temporal target datatype: ${datatype}`);
}

function getPeriodProjection(fieldPath) {
    if (typeof fieldPath !== "string" || fieldPath.length === 0) {
        throw new Error("Period projection requires a non-empty extraction path");
    }
    return {
        startField: `${fieldPath}.start.normalizedStart`,
        endField: `${fieldPath}.end.normalizedEnd`,
        startObject: `${fieldPath}.start`,
        endObject: `${fieldPath}.end`
    };
}

/**
 * @param {Object} filter
 * @param {string} arrayPath
 * @returns {Object}
 */
function stripArrayPath(filter, arrayPath) {
    if (Array.isArray(filter)) {
        return filter.map((entry) => stripArrayPath(entry, arrayPath));
    }
    if (typeof filter === "string" && filter.startsWith(`$${arrayPath}.`)) {
        return `$${filter.slice(arrayPath.length + 2)}`;
    }
    if (!filter || typeof filter !== "object") {
        return filter;
    }
    const prototype = Object.getPrototypeOf(filter);
    if (prototype !== Object.prototype && prototype !== null) {
        return filter;
    }

    const result = {};
    for (const [key, value] of Object.entries(filter)) {
        if (key.startsWith("$")) {
            result[key] = stripArrayPath(value, arrayPath);
            continue;
        }
        const prefix = `${arrayPath}.`;
        const relativeKey = key.startsWith(prefix) ? key.slice(prefix.length) : key;
        result[relativeKey] = stripArrayPath(value, arrayPath);
    }
    return result;
}

/**
 * @param {unknown} filter
 * @param {Array<{ $expr: unknown }>} expressions
 * @returns {unknown}
 */
function stripExpressions(filter, expressions) {
    if (Array.isArray(filter)) {
        return filter
            .map((entry) => stripExpressions(entry, expressions))
            .filter((entry) => entry !== undefined);
    }
    if (!filter || typeof filter !== "object") {
        return filter;
    }
    const prototype = Object.getPrototypeOf(filter);
    if (prototype !== Object.prototype && prototype !== null) {
        return filter;
    }

    const result = {};
    for (const [key, value] of Object.entries(filter)) {
        if (key === "$expr") {
            expressions.push({ $expr: value });
            continue;
        }
        const stripped = stripExpressions(value, expressions);
        if (
            (key === "$and" || key === "$or" || key === "$nor") &&
            Array.isArray(stripped) &&
            stripped.length === 0
        ) {
            continue;
        }
        result[key] = stripped;
    }
    return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * @param {Object} filter
 * @param {string} fieldPath
 * @param {string[] | undefined} arrayPaths
 * @returns {Object}
 */
function correlateTemporalFilter(filter, fieldPath, arrayPaths) {
    const paths = (arrayPaths || [])
        .filter(
            (arrayPath) =>
                typeof arrayPath === "string" &&
                arrayPath.length > 0 &&
                (arrayPath === fieldPath || fieldPath.startsWith(`${arrayPath}.`)) &&
                !arrayPath.split(".").some((segment) => /^\d+$/.test(segment))
        )
        .sort((left, right) => right.split(".").length - left.split(".").length);

    if (paths.length === 0) {
        return filter;
    }

    const expressions = [];
    const filterWithoutExpressions = stripExpressions(filter, expressions) || {};
    const correlated = paths.reduce(
        (current, arrayPath) => ({
            [arrayPath]: {
                $elemMatch: stripArrayPath(current, arrayPath)
            }
        }),
        filterWithoutExpressions
    );

    return expressions.length > 0
        ? {
              ...correlated,
              $and: expressions
          }
        : correlated;
}

/**
 * @param {string} fieldPath
 * @param {string} datatype
 * @param {{ range?: { kind: 'date' | 'dateTime', start: string | import('mongoose').Types.Decimal128, end: string | import('mongoose').Types.Decimal128 }, value: string, kind: 'date' | 'dateTime' | 'instant' }} temporal
 * @param {string | undefined} comparator
 * @param {string[] | undefined} arrayPaths
 * @returns {Object}
 */
function buildTemporalFilter(fieldPath, datatype, temporal, comparator, arrayPaths) {
    let filter;
    if (datatype === "instant" && temporal.kind === "instant") {
        filter = buildInstantQuery(fieldPath, temporal, comparator);
    } else {
        if (!temporal.range) {
            throw new Error(`Temporal query range is unavailable for ${temporal.kind}`);
        }
        if (!["date", "dateTime", "instant"].includes(datatype)) {
            throw new Error(`Unsupported temporal target datatype: ${datatype}`);
        }

        const range = getComparisonRange(
            getTargetQueryRange(temporal.range, datatype),
            comparator
        );

        const projection = getTemporalProjection(fieldPath, datatype);
        if ("pointField" in projection) {
            filter = buildPointFilter(projection.pointField, range, comparator);
        } else {
            filter = buildRangeFilter(
                projection.startField,
                projection.endField,
                range,
                comparator
            );
        }
    }
    return correlateTemporalFilter(filter, fieldPath, arrayPaths);
}

function buildPeriodBoundaryFilter(field, objectField, operator, value, allowMissing) {
    const valueFilter = { [field]: { [operator]: value } };
    if (!allowMissing) {
        return valueFilter;
    }
    return {
        $or: [valueFilter, { [objectField]: { $exists: false } }]
    };
}

function buildPeriodRangeFilter(
    startField,
    endField,
    startObject,
    endObject,
    range,
    comparator = "eq"
) {
    const containsQuery = {
        $and: [
            buildPeriodBoundaryFilter(startField, startObject, "$lte", range.start, true),
            buildPeriodBoundaryFilter(endField, endObject, "$gte", range.end, true)
        ]
    };
    const startsBeforeQuery = buildPeriodBoundaryFilter(
        startField,
        startObject,
        "$lt",
        range.start,
        true
    );
    const endsAfterQuery = buildPeriodBoundaryFilter(
        endField,
        endObject,
        "$gt",
        range.end,
        true
    );
    const startsAfterQuery = buildPeriodBoundaryFilter(
        startField,
        startObject,
        "$gte",
        range.end,
        false
    );
    const endsBeforeQuery = buildPeriodBoundaryFilter(
        endField,
        endObject,
        "$lte",
        range.start,
        false
    );
    const intersectsQuery = {
        $and: [
            buildPeriodBoundaryFilter(startField, startObject, "$lt", range.end, true),
            buildPeriodBoundaryFilter(endField, endObject, "$gt", range.start, true)
        ]
    };

    const withExistingPeriod = (filter) => {
        const periodExists = {
            $or: [{ [startObject]: { $exists: true } }, { [endObject]: { $exists: true } }]
        };
        if (filter.$and) {
            return { ...filter, $and: [...filter.$and, periodExists] };
        }
        return { $and: [filter, periodExists] };
    };

    switch (comparator) {
        case undefined:
        case "eq":
            return withExistingPeriod(containsQuery);
        case "ne":
            return { $nor: [withExistingPeriod(containsQuery)] };
        case "lt":
            return withExistingPeriod(startsBeforeQuery);
        case "gt":
            return withExistingPeriod(endsAfterQuery);
        case "ge":
            return withExistingPeriod({ $or: [endsAfterQuery, containsQuery] });
        case "le":
            return withExistingPeriod({ $or: [startsBeforeQuery, containsQuery] });
        case "sa":
            return withExistingPeriod(startsAfterQuery);
        case "eb":
            return withExistingPeriod(endsBeforeQuery);
        case "ap":
            return withExistingPeriod(intersectsQuery);
        default:
            throw new Error(`Unsupported temporal comparator: ${comparator}`);
    }
}

function buildPeriodTemporalFilter(fieldPath, temporal, comparator, arrayPaths) {
    if (!temporal?.range) {
        throw new Error(`Temporal query range is unavailable for ${temporal?.kind}`);
    }
    const range = getComparisonRange(getTargetQueryRange(temporal.range, "dateTime"), comparator);
    const projection = getPeriodProjection(fieldPath);
    const filter = buildPeriodRangeFilter(
        projection.startField,
        projection.endField,
        projection.startObject,
        projection.endObject,
        range,
        comparator
    );
    return correlateTemporalFilter(filter, fieldPath, arrayPaths);
}

/**
 * @param {string} startField
 * @param {string} endField
 * @param {{ kind: 'date' | 'dateTime', start: string | import('mongoose').Types.Decimal128, end: string | import('mongoose').Types.Decimal128 }} range
 * @param {string | undefined} comparator
 * @returns {Object}
 */
function buildRangeFilter(startField, endField, range, comparator = "eq") {
    const eq = {
        [startField]: { $gte: range.start },
        [endField]: { $lte: range.end }
    };
    const gt = { [endField]: { $gt: range.end } };
    const lt = { [startField]: { $lt: range.start } };

    switch (comparator) {
        case undefined:
        case "eq":
            return eq;
        case "ne":
            return { $nor: [eq] };
        case "lt":
            return lt;
        case "gt":
            return gt;
        case "ge":
            return { $or: [gt, eq] };
        case "le":
            return { $or: [lt, eq] };
        case "sa":
            return { [startField]: { $gte: range.end } };
        case "eb":
            return { [endField]: { $lte: range.start } };
        case "ap":
            return {
                [startField]: { $lt: range.end },
                [endField]: { $gt: range.start }
            };
        default:
            throw new Error(`Unsupported temporal comparator: ${comparator}`);
    }
}

/**
 * @param {string} field
 * @param {{ kind: 'dateTime', start: import('mongoose').Types.Decimal128, end: import('mongoose').Types.Decimal128 }} range
 * @param {string | undefined} comparator
 * @returns {Object}
 */
function buildPointFilter(field, range, comparator = "eq") {
    const eq = { [field]: { $gte: range.start, $lt: range.end } };
    switch (comparator) {
        case undefined:
        case "eq":
            return eq;
        case "ne":
            return { $nor: [eq] };
        case "lt":
            return { [field]: { $lt: range.start } };
        case "gt":
            return { [field]: { $gte: range.end } };
        case "ge":
            return { [field]: { $gte: range.start } };
        case "le":
            return { [field]: { $lt: range.end } };
        case "sa":
            return { [field]: { $gte: range.end } };
        case "eb":
            return { [field]: { $lt: range.start } };
        case "ap":
            return { [field]: { $gte: range.start, $lt: range.end } };
        default:
            throw new Error(`Unsupported temporal comparator: ${comparator}`);
    }
}

module.exports = {
    APPROXIMATION_RATIO,
    getTemporalProjection,
    getPeriodProjection,
    buildTemporalFilter,
    buildPeriodTemporalFilter,
    buildRangeFilter,
    buildPeriodRangeFilter,
    buildPointFilter,
    correlateTemporalFilter,
    approximateCalendarRange,
    approximateDecimalRange
};
