const mongoose = require("mongoose");
const {
    DATE_PATTERN,
    DATETIME_PATTERN,
    INSTANT_PATTERN,
    INSTANT_PRECISION,
    INSTANT_PRECISION_VALUES,
    isDecimal128,
    normalizeInstantSafe
} = require("../../temporal");
const {
    inferDatePrecision,
    inferDateTimePrecision,
    inferInstantPrecision
} = require("../../temporal/lexical");
const {
    TEMPORAL_ERROR_CODE,
    TemporalValidationError,
    assertPublicTemporalScalar,
    normalizeDateTimeSafe
} = require("../../temporal/errors");
const { expectedDateBoundaries, isCalendarDate } = require("../../temporal/calendar");
const { calendarDateToUtcEpoch } = require("../../temporal/epoch");
const { addDecimal, divideDecimalByTen } = require("../../temporal/arithmetic");
const {
    APPROXIMATION_RATIO,
    approximateCalendarRange,
    approximateDecimalRange
} = require("../../temporal/approximation");

const COMPARATOR_PREFIXES = ["eq", "ne", "lt", "gt", "ge", "le", "sa", "eb", "ap"];
const INSTANT_COMPARATORS = Object.freeze([...COMPARATOR_PREFIXES]);
const TEMPORAL_KINDS = new Set(["date", "dateTime", "instant"]);
const INSTANT_WITHOUT_TIMEZONE_PATTERN =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/;

/**
 * @typedef {Object} TemporalQueryValue
 * @property {string} rawValue
 * @property {string} value
 * @property {'date' | 'dateTime' | 'instant'} kind
 * @property {string} precision
 * @property {number} [fractionDigits]
 * @property {string} [comparator]
 * @property {TemporalQueryRange} [range]
 * @property {string | import('mongoose').Types.Decimal128} [queryStart]
 * @property {string | import('mongoose').Types.Decimal128} [queryEnd]
 * @property {import('mongoose').Types.Decimal128} [epochSeconds]
 */

/**
 * @typedef {Object} DateQueryRange
 * @property {'date'} kind
 * @property {string} start
 * @property {string} end
 */

/**
 * @typedef {Object} DateTimeQueryRange
 * @property {'dateTime'} kind
 * @property {import('mongoose').Types.Decimal128} start
 * @property {import('mongoose').Types.Decimal128} end
 */

/**
 * @typedef {DateQueryRange | DateTimeQueryRange} TemporalQueryRange
 */

/**
 * @typedef {Object} InstantQueryValue
 * @property {string} rawValue
 * @property {string} value
 * @property {'instant'} kind
 * @property {'second' | 'fraction'} precision
 * @property {number} [fractionDigits]
 * @property {string} [comparator]
 * @property {import('mongoose').Types.Decimal128} epochSeconds
 */

/**
 * @param {string} rawValue
 * @returns {{ value: string, comparator: string | undefined }}
 */
function splitComparatorPrefix(rawValue) {
    for (const comparator of COMPARATOR_PREFIXES) {
        if (rawValue.startsWith(comparator) && rawValue.length > comparator.length) {
            return {
                comparator,
                value: rawValue.slice(comparator.length)
            };
        }
    }

    return { value: rawValue, comparator: undefined };
}

/**
 * @param {string} rawValue
 * @returns {{ value: string, comparator: string | undefined }}
 */
function splitInstantComparator(rawValue) {
    return splitComparatorPrefix(rawValue);
}

/**
 * @param {string} value
 * @param {'date' | 'dateTime' | 'instant'} kind
 * @returns {string}
 */
function validateCalendarDate(value, kind) {
    const dateValue = value.split("T", 1)[0];
    if (dateValue.length === 10 && !isCalendarDate(dateValue)) {
        throw new TemporalValidationError(
            TEMPORAL_ERROR_CODE.INVALID_TEMPORAL_VALUE,
            `Invalid FHIR ${kind} calendar date: ${dateValue}`
        );
    }
    return value;
}

/**
 * @param {string} value
 * @param {'date' | 'dateTime' | 'instant'} kind
 * @returns {{ precision: string, fractionDigits?: number }}
 */
function parseTemporalLexicalValue(value, kind) {
    if (kind === "instant" && INSTANT_WITHOUT_TIMEZONE_PATTERN.test(value)) {
        throw new TemporalValidationError(
            TEMPORAL_ERROR_CODE.MISSING_INSTANT_TIMEZONE,
            `FHIR instant must include a timezone: ${value}`
        );
    }

    const pattern =
        kind === "date"
            ? DATE_PATTERN
            : kind === "dateTime"
              ? DATETIME_PATTERN
              : INSTANT_PATTERN;
    if (!pattern.test(value)) {
        throw new TemporalValidationError(
            TEMPORAL_ERROR_CODE.INVALID_TEMPORAL_VALUE,
            `Invalid FHIR ${kind} query value: ${value}`
        );
    }

    validateCalendarDate(value, kind);
    const inferred =
        kind === "date"
            ? inferDatePrecision(value)
            : kind === "dateTime"
              ? inferDateTimePrecision(value)
              : inferInstantPrecision(value);
    if (!inferred) {
        throw new TemporalValidationError(
            TEMPORAL_ERROR_CODE.ILLEGAL_PRECISION,
            `Unable to infer ${kind} query precision for value: ${value}`
        );
    }
    return typeof inferred === "string"
        ? { precision: inferred }
        : {
              precision: inferred.precision,
              fractionDigits: inferred.fractionDigits
          };
}

/**
 * @param {string} value
 * @param {'date' | 'dateTime'} kind
 * @returns {TemporalQueryRange}
 */
function normalizeTemporalQueryRange(value, kind) {
    if (kind === "date") {
        const inferred = parseTemporalLexicalValue(value, kind);
        const boundaries = expectedDateBoundaries(value, inferred.precision);
        if (!boundaries) {
            throw new TemporalValidationError(
                TEMPORAL_ERROR_CODE.ILLEGAL_PRECISION,
                `Unable to derive date query boundaries for value: ${value}`
            );
        }
        return {
            kind,
            start: boundaries.normalizedStart,
            end: boundaries.normalizedEnd
        };
    }

    if (kind === "dateTime") {
        const canonical = normalizeDateTimeSafe(value);
        return {
            kind,
            start: canonical.normalizedStart,
            end: canonical.normalizedEnd
        };
    }

    throw new TemporalValidationError(
        TEMPORAL_ERROR_CODE.INVALID_TEMPORAL_VALUE,
        `Temporal query range is not supported for kind: ${kind}`
    );
}

/**
 * @param {unknown} rawValue
 * @returns {InstantQueryValue}
 */
function parseInstantQueryValue(rawValue) {
    if (typeof rawValue !== "string" || rawValue.length === 0) {
        throw new Error("FHIR instant query value must be a non-empty string");
    }

    const split = splitInstantComparator(rawValue);
    const canonical = normalizeInstantSafe(split.value);
    /** @type {InstantQueryValue} */
    const query = {
        rawValue,
        value: canonical.value,
        kind: "instant",
        precision: canonical.precision,
        epochSeconds: canonical.epochSeconds
    };
    if (canonical.fractionDigits !== undefined) {
        query.fractionDigits = canonical.fractionDigits;
    }
    if (split.comparator !== undefined) {
        query.comparator = split.comparator;
    }
    return query;
}

/**
 * @param {unknown} rawValue
 * @param {'date' | 'dateTime' | 'instant'} kind
 * @returns {TemporalQueryValue}
 */
function parseTemporalQueryValue(rawValue, kind) {
    if (!TEMPORAL_KINDS.has(kind)) {
        throw new Error(`Unsupported temporal query kind: ${kind}`);
    }
    if (typeof rawValue !== "string" || rawValue.length === 0) {
        throw new Error(`FHIR ${kind} query value must be a non-empty string`);
    }

    const split = splitComparatorPrefix(rawValue);
    if (kind === "instant") {
        return parseInstantQueryValue(rawValue);
    }
    assertPublicTemporalScalar(split.value, kind);
    const inferred = parseTemporalLexicalValue(split.value, kind);
    const parsed = {
        rawValue,
        value: split.value,
        kind,
        precision: inferred.precision
    };

    if (kind === "date" || kind === "dateTime") {
        parsed.range = normalizeTemporalQueryRange(split.value, kind);
        parsed.queryStart = parsed.range.start;
        parsed.queryEnd = parsed.range.end;
    }

    if (split.comparator !== undefined) {
        parsed.comparator = split.comparator;
    }
    if (inferred.fractionDigits !== undefined) {
        parsed.fractionDigits = inferred.fractionDigits;
    }

    return parsed;
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

/**
 * @param {InstantQueryValue} query
 * @returns {void}
 */
function assertInstantQueryValue(query) {
    if (!query || query.kind !== "instant") {
        throw new Error("Instant query value must have kind instant");
    }
    if (!INSTANT_PRECISION_VALUES.has(query.precision)) {
        throw new Error("Instant query precision must be second or fraction");
    }
    if (
        query.precision === INSTANT_PRECISION.FRACTION &&
        (!Number.isInteger(query.fractionDigits) || query.fractionDigits <= 0)
    ) {
        throw new Error("Instant query fractionDigits must be a positive integer");
    }
    if (
        query.precision === INSTANT_PRECISION.SECOND &&
        query.fractionDigits !== undefined
    ) {
        throw new Error("Instant query fractionDigits requires fraction precision");
    }
    if (!isDecimal128(query.epochSeconds)) {
        throw new Error("Instant query epochSeconds must be a Decimal128 value");
    }
}

/**
 * @param {InstantQueryValue} query
 * @returns {string}
 */
function getApproximationDeltaString(query) {
    const unit =
        query.precision === INSTANT_PRECISION.SECOND
            ? "1"
            : `0.${"0".repeat(query.fractionDigits - 1)}1`;
    return divideDecimalByTen(unit);
}

/**
 * @param {string} fieldPath
 * @param {InstantQueryValue} query
 * @param {string | undefined} [comparator]
 * @returns {Object}
 */
function buildInstantQuery(fieldPath, query, comparator = query?.comparator) {
    assertInstantQueryValue(query);
    if (!INSTANT_COMPARATORS.includes(comparator ?? "eq")) {
        throw new Error(`Unsupported instant comparator: ${comparator}`);
    }

    const field = `${fieldPath}.epochSeconds`;
    const point = query.epochSeconds;
    switch (comparator) {
        case undefined:
        case "eq":
            return { [field]: { $eq: point } };
        case "ne":
            return { [field]: { $ne: point } };
        case "lt":
        case "eb":
            return { [field]: { $lt: point } };
        case "gt":
        case "sa":
            return { [field]: { $gt: point } };
        case "ge":
            return { [field]: { $gte: point } };
        case "le":
            return { [field]: { $lte: point } };
        case "ap": {
            const delta = getApproximationDeltaString(query);
            return {
                [field]: {
                    $gte: mongoose.Types.Decimal128.fromString(
                        addDecimal(point.toString(), delta, -1)
                    ),
                    $lte: mongoose.Types.Decimal128.fromString(
                        addDecimal(point.toString(), delta, 1)
                    )
                }
            };
        }
        default:
            throw new Error(`Unsupported instant comparator: ${comparator}`);
    }
}

/**
 * @param {string} fieldPath
 * @param {string} datatype
 * @param {TemporalQueryValue} temporal
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
 * @param {string} fieldPath
 * @param {string} rawValue
 * @param {{ comparator?: string, arrayPaths?: string[], temporal?: TemporalQueryValue }} [options]
 * @returns {Object}
 */
function buildPeriodTemporalSearchFilter(fieldPath, rawValue, options = {}) {
    const { comparator, arrayPaths, temporal: preParsed } = options;
    const parsed = preParsed ?? parseTemporalQueryValue(rawValue, "dateTime");
    return buildPeriodTemporalFilter(
        fieldPath,
        parsed,
        comparator ?? parsed.comparator,
        arrayPaths
    );
}

/**
 * @param {string} fieldPath
 * @param {'date' | 'dateTime' | 'instant' | 'Period'} targetDatatype
 * @param {string} rawValue
 * @param {{ comparator?: string, arrayPaths?: string[], temporal?: TemporalQueryValue }} [options]
 * @returns {Object}
 */
function buildTemporalSearchFilter(fieldPath, targetDatatype, rawValue, options = {}) {
    const { comparator, arrayPaths, temporal: preParsed } = options;

    if (targetDatatype === "Period") {
        return buildPeriodTemporalSearchFilter(fieldPath, rawValue, options);
    }

    const parsed = preParsed ?? parseTemporalQueryValue(rawValue, targetDatatype);
    return buildTemporalFilter(
        fieldPath,
        targetDatatype,
        parsed,
        comparator ?? parsed.comparator,
        arrayPaths
    );
}

module.exports = {
    APPROXIMATION_RATIO,
    COMPARATOR_PREFIXES,
    INSTANT_COMPARATORS,
    TEMPORAL_KINDS,
    splitComparatorPrefix,
    splitInstantComparator,
    normalizeTemporalQueryRange,
    parseTemporalQueryValue,
    parseInstantQueryValue,
    buildTemporalSearchFilter,
    buildPeriodTemporalSearchFilter,
    getTemporalProjection,
    getPeriodProjection,
    buildTemporalFilter,
    buildPeriodTemporalFilter,
    buildRangeFilter,
    buildPeriodRangeFilter,
    buildPointFilter,
    buildInstantQuery,
    correlateTemporalFilter,
    approximateCalendarRange,
    approximateDecimalRange
};
