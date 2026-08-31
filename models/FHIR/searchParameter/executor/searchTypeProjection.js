const {
    stringQuery,
    tokenQuery,
    numberQuery,
    quantityQuery,
    referenceQuery,
    uriQuery
} = require("./queryPrimitives");
const {
    normalizeReferenceQueryValue,
    validateReferenceQueryValue
} = require("./referenceValueParser");
const {
    buildTemporalFilter,
    buildPeriodTemporalFilter,
    correlateTemporalFilter
} = require("./temporalQueryFilter");
const { parseTemporalQueryValue } = require("./temporalQueryParser");
const {
    DATE_PATTERN,
    DATETIME_PATTERN,
    INSTANT_PATTERN,
    DATE_PRECISION_VALUES,
    DATETIME_PRECISION_VALUES,
    INSTANT_PRECISION_VALUES
} = require("../../temporal/constants");

const NON_PROJECTABLE_DATATYPES = new Set([
    "BackboneElement",
    "Element",
    "Narrative",
    "Extension",
    "Meta",
    "Timing",
    "Range",
    "Ratio",
    "Annotation"
]);

const ADDRESS_STRING_FIELDS = ["line", "city", "district", "state", "postalCode", "country"];
const HUMAN_NAME_STRING_FIELDS = ["text", "family", "given", "prefix", "suffix"];
const TEMPORAL_DATATYPES = new Set(["date", "dateTime", "instant"]);

/**
 * MongoDB cannot invoke the application-side canonical validators while
 * matching a document. Keep the same value/precision/boundary checks in the
 * server-side expression so a raw field and a superficially shaped object do
 * not count as a searchable value.
 *
 * @param {unknown} value
 * @param {"date" | "dateTime" | "instant"} type
 * @returns {boolean}
 */
function canonicalTemporalValueMatches(value, type) {
    if (Array.isArray(value)) {
        return value.some((entry) => canonicalTemporalValueMatches(entry, type));
    }
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }
    if (type === "Period") {
        return (
            (Object.prototype.hasOwnProperty.call(value, "start") ||
                Object.prototype.hasOwnProperty.call(value, "end")) &&
            (!Object.prototype.hasOwnProperty.call(value, "start") ||
                canonicalTemporalValueMatches(value.start, "dateTime")) &&
            (!Object.prototype.hasOwnProperty.call(value, "end") ||
                canonicalTemporalValueMatches(value.end, "dateTime"))
        );
    }

    const allowedFields =
        type === "date"
            ? ["value", "precision", "normalizedStart", "normalizedEnd"]
            : type === "dateTime"
              ? ["value", "precision", "fractionDigits", "normalizedStart", "normalizedEnd"]
              : ["value", "precision", "fractionDigits", "epochSeconds"];
    if (Object.keys(value).some((field) => !allowedFields.includes(field))) {
        return false;
    }

    const datePattern =
        /^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1]))?)?$/;
    const dateTimePattern =
        /^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(?:-(0[1-9]|1[0-2])(?:-(0[1-9]|[1-2][0-9]|3[0-1])(?:T([01][0-9]|2[0-3]):[0-5][0-9](?::([0-5][0-9]|60)(?:\.[0-9]+)?)?(?:Z|(?:\+|-)(?:(?:0[0-9]|1[0-3]):[0-5][0-9]|14:00))?)?)?)?$/;
    const instantPattern =
        /^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])T([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\.[0-9]+)?(Z|(\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00))$/;
    const isLeapYear = (year) =>
        year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const daysInMonth = (year, month) =>
        month === 2
            ? isLeapYear(year)
                ? 29
                : 28
            : [4, 6, 9, 11].includes(month)
              ? 30
              : 31;
    const isCalendarDate = (calendarDate) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(calendarDate)) {
            return false;
        }
        const [year, month, day] = calendarDate.split("-").map(Number);
        return (
            year >= 1 &&
            year <= 9999 &&
            month >= 1 &&
            month <= 12 &&
            day >= 1 &&
            day <= daysInMonth(year, month)
        );
    };
    const formatCalendarDate = (date) =>
        [
            String(date.getUTCFullYear()).padStart(4, "0"),
            String(date.getUTCMonth() + 1).padStart(2, "0"),
            String(date.getUTCDate()).padStart(2, "0")
        ].join("-");
    const addCalendarDays = (calendarDate, days) => {
        const [year, month, day] = calendarDate.split("-").map(Number);
        if (year === 9999 && month === 12 && day + days > 31) {
            return "9999-12-31";
        }
        const date = new Date(0);
        date.setUTCFullYear(year, month - 1, day + days);
        if (date.getUTCFullYear() > 9999) {
            return "9999-12-31";
        }
        return formatCalendarDate(date);
    };
    const dateBoundaries = (rawValue, precision) => {
        if (precision === "year") {
            const year = Number(rawValue);
            return {
                start: `${rawValue}-01-01`,
                end:
                    year === 9999
                        ? "9999-12-31"
                        : `${String(year + 1).padStart(4, "0")}-01-01`
            };
        }
        if (precision === "month") {
            const [year, month] = rawValue.split("-").map(Number);
            if (year === 9999 && month === 12) {
                return {
                    start: `${rawValue}-01`,
                    end: "9999-12-31"
                };
            }
            const date = new Date(0);
            date.setUTCFullYear(year, month, 1);
            return {
                start: `${rawValue}-01`,
                end: formatCalendarDate(date).slice(0, 7) + "-01"
            };
        }
        return {
            start: rawValue,
            end: addCalendarDays(rawValue, 1)
        };
    };
    const decimalParts = (rawValue) => {
        const text = String(rawValue).replace(/^NumberDecimal\("(.*)"\)$/, "$1");
        const match = text.match(
            /^([+-]?)(\d+)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/
        );
        if (!match) {
            return null;
        }
        const sign = match[1] === "-" ? -1n : 1n;
        let digits = `${match[2]}${match[3] || ""}`.replace(/^0+(?=\d)/, "") || "0";
        let scale = (match[3] || "").length - Number(match[4] || 0);
        if (scale < 0) {
            digits += "0".repeat(-scale);
            scale = 0;
        }
        return { coefficient: sign * BigInt(digits), scale };
    };
    const decimalText = (coefficient, scale) => {
        if (coefficient === 0n) {
            return "0";
        }
        const sign = coefficient < 0n ? "-" : "";
        const digits = (coefficient < 0n ? -coefficient : coefficient)
            .toString()
            .padStart(scale + 1, "0");
        if (scale === 0) {
            return `${sign}${digits}`;
        }
        const integer = digits.slice(0, -scale) || "0";
        const fraction = digits.slice(-scale).replace(/0+$/, "");
        return fraction ? `${sign}${integer}.${fraction}` : `${sign}${integer}`;
    };
    const decimalEqual = (left, right) => {
        const leftParts = decimalParts(left);
        const rightParts = decimalParts(right);
        if (!leftParts || !rightParts) {
            return false;
        }
        const scale = Math.max(leftParts.scale, rightParts.scale);
        return (
            leftParts.coefficient * 10n ** BigInt(scale - leftParts.scale) ===
            rightParts.coefficient * 10n ** BigInt(scale - rightParts.scale)
        );
    };
    const decimalAdd = (left, right) => {
        const leftParts = decimalParts(left);
        const rightParts = decimalParts(right);
        if (!leftParts || !rightParts) {
            return null;
        }
        const scale = Math.max(leftParts.scale, rightParts.scale);
        return decimalText(
            leftParts.coefficient * 10n ** BigInt(scale - leftParts.scale) +
                rightParts.coefficient * 10n ** BigInt(scale - rightParts.scale),
            scale
        );
    };
    const epochSeconds = (rawValue) => {
        const components = rawValue.match(
            /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}|60)(?:\.(\d+))?(Z|([+-])(\d{2}):(\d{2}))?$/
        );
        if (!components) {
            return null;
        }
        const date = new Date(0);
        date.setUTCFullYear(
            Number(components[1]),
            Number(components[2]) - 1,
            Number(components[3])
        );
        date.setUTCHours(
            Number(components[4]),
            Number(components[5]),
            Number(components[6]),
            0
        );
        let seconds = String(Math.floor(date.getTime() / 1000));
        const offset =
            components[8] === undefined || components[8] === "Z"
                ? 0
                : (components[9] === "+" ? 1 : -1) *
                  (Number(components[10]) * 3600 + Number(components[11]) * 60);
        seconds = decimalAdd(seconds, String(-offset));
        return components[7] ? decimalAdd(seconds, `0.${components[7]}`) : seconds;
    };
    const inferredPrecision = (rawValue, targetType) => {
        if (/^\d{4}$/.test(rawValue)) {
            return { precision: "year" };
        }
        if (/^\d{4}-\d{2}$/.test(rawValue)) {
            return { precision: "month" };
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
            return { precision: "day" };
        }
        const fraction = rawValue.match(/T\d{2}:\d{2}:\d{2}\.(\d+)/);
        if (fraction) {
            return { precision: "fraction", fractionDigits: fraction[1].length };
        }
        if (/T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})?$/.test(rawValue)) {
            return { precision: "second" };
        }
        if (
            targetType === "dateTime" &&
            /T\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})?$/.test(rawValue)
        ) {
            return { precision: "minute" };
        }
        return null;
    };

    if (type === "date") {
        if (
            typeof value.value !== "string" ||
            !datePattern.test(value.value) ||
            !["year", "month", "day"].includes(value.precision) ||
            typeof value.normalizedStart !== "string" ||
            typeof value.normalizedEnd !== "string" ||
            !isCalendarDate(value.normalizedStart) ||
            !isCalendarDate(value.normalizedEnd)
        ) {
            return false;
        }
        const inferred = inferredPrecision(value.value, type);
        if (!inferred || inferred.precision !== value.precision) {
            return false;
        }
        const expected = dateBoundaries(value.value, value.precision);
        return (
            value.normalizedStart === expected.start &&
            value.normalizedEnd === expected.end &&
            value.normalizedStart < value.normalizedEnd
        );
    }

    const pattern = type === "dateTime" ? dateTimePattern : instantPattern;
    if (typeof value.value !== "string" || !pattern.test(value.value)) {
        return false;
    }
    const inferred = inferredPrecision(value.value, type);
    const allowedPrecisions =
        type === "dateTime"
            ? ["year", "month", "day", "minute", "second", "fraction"]
            : ["second", "fraction"];
    if (
        !inferred ||
        !allowedPrecisions.includes(value.precision) ||
        inferred.precision !== value.precision
    ) {
        return false;
    }
    if (value.precision === "fraction") {
        if (value.fractionDigits !== inferred.fractionDigits) {
            return false;
        }
    } else if (Object.prototype.hasOwnProperty.call(value, "fractionDigits")) {
        return false;
    }

    let expectedStart;
    let expectedEnd;
    if (type === "dateTime" && ["year", "month", "day"].includes(value.precision)) {
        const calendar = dateBoundaries(
            value.value,
            value.precision === "year" ? "year" : value.precision
        );
        expectedStart = epochSeconds(`${calendar.start}T00:00:00Z`);
        expectedEnd = epochSeconds(`${calendar.end}T00:00:00Z`);
    } else {
        expectedStart = epochSeconds(value.value);
        if (!expectedStart) {
            return false;
        }
        const increment =
            value.precision === "minute"
                ? "60"
                : value.precision === "second"
                  ? "1"
                  : `0.${"0".repeat(value.fractionDigits - 1)}1`;
        expectedEnd = decimalAdd(expectedStart, increment);
    }
    if (type === "instant") {
        return decimalEqual(
            value.epochSeconds && value.epochSeconds.toString(),
            expectedStart
        );
    }
    return (
        decimalEqual(
            value.normalizedStart && value.normalizedStart.toString(),
            expectedStart
        ) &&
        decimalEqual(value.normalizedEnd && value.normalizedEnd.toString(), expectedEnd)
    );
}

const CANONICAL_TEMPORAL_VALIDATOR_BODY = canonicalTemporalValueMatches;

/**
 * @param {string} searchType
 * @param {string} datatype
 * @returns {boolean}
 */
function hasSearchTypeProjection(searchType, datatype) {
    if (!datatype) {
        return false;
    }
    if (searchType === "quantity" && datatype === "SampledData") {
        return false;
    }
    if (NON_PROJECTABLE_DATATYPES.has(datatype)) {
        return false;
    }

    switch (searchType) {
        case "string":
            return (
                datatype === "Address" ||
                datatype === "HumanName" ||
                datatype === "string" ||
                datatype === "uri" ||
                datatype === "code" ||
                datatype === "markdown"
            );
        case "token":
            return (
                datatype === "CodeableConcept" ||
                datatype === "Identifier" ||
                datatype === "ContactPoint" ||
                datatype === "Coding" ||
                datatype === "code" ||
                datatype === "boolean" ||
                datatype === "string" ||
                datatype === "dateTime" ||
                datatype === "id"
            );
        case "reference":
            return (
                datatype === "Reference" ||
                datatype === "canonical" ||
                datatype === "Resource" ||
                datatype === "uri"
            );
        case "date":
            return (
                datatype === "Period" ||
                datatype === "date" ||
                datatype === "dateTime" ||
                datatype === "instant"
            );
        case "dateTime":
            return datatype === "Period" || datatype === "dateTime" || datatype === "instant";
        case "quantity":
            return (
                datatype === "Quantity" ||
                datatype === "Age" ||
                datatype === "Money" ||
                datatype === "Duration"
            );
        case "number":
            return (
                datatype === "decimal" ||
                datatype === "integer" ||
                datatype === "positiveInt" ||
                datatype === "unsignedInt" ||
                datatype === "number"
            );
        case "uri":
            return (
                datatype === "uri" ||
                datatype === "url" ||
                datatype === "canonical" ||
                datatype === "string"
            );
        default:
            return false;
    }
}

/**
 * @param {{ kind: string, value?: string }[] | undefined} predicates
 * @param {string} kind
 * @returns {{ kind: string, value?: string } | undefined}
 */
function findPredicate(predicates, kind) {
    return predicates?.find((entry) => entry.kind === kind);
}

/**
 * @param {string} searchType
 * @param {string} value
 * @param {string} fieldPath
 * @param {string} datatype
 * @param {string | undefined} modifier
 * @param {string | undefined} comparator
 * @param {string | undefined} referenceTargetType
 * @param {{ kind: string, value?: string }[] | undefined} predicates
 * @param {import('./temporalQueryParser').TemporalQueryValue | undefined} [temporal]
 * @param {string[] | undefined} [arrayPaths]
 * @returns {Object}
 */
function buildProjectedFilter(
    searchType,
    value,
    fieldPath,
    datatype,
    modifier,
    comparator,
    referenceTargetType,
    predicates,
    temporal,
    arrayPaths
) {
    if (modifier === "missing") {
        return buildMissingProjection(
            searchType,
            fieldPath,
            datatype,
            value,
            predicates,
            arrayPaths
        );
    }

    switch (searchType) {
        case "string":
            return buildStringProjection(value, fieldPath, datatype, modifier);
        case "token":
            return buildTokenProjection(value, fieldPath, datatype, modifier, predicates);
        case "reference":
            return buildReferenceProjection(
                value,
                fieldPath,
                datatype,
                referenceTargetType,
                predicates
            );
        case "date":
        case "dateTime":
            return buildDateProjection(
                value,
                fieldPath,
                datatype,
                comparator,
                searchType,
                temporal,
                arrayPaths
            );
        case "quantity":
            return buildQuantityProjection(value, fieldPath, comparator);
        case "number":
            return buildNumberProjection(value, fieldPath, comparator);
        case "uri":
            return buildUriProjection(value, fieldPath, modifier);
        default:
            throw new Error(`Unsupported search type: ${searchType}`);
    }
}

/**
 * @param {string} searchType
 * @param {string} fieldPath
 * @param {string} datatype
 * @param {string} rawValue
 * @param {{ kind: string, value?: string }[] | undefined} predicates
 * @param {string[] | undefined} arrayPaths
 * @returns {Object}
 */
function buildMissingProjection(
    searchType,
    fieldPath,
    datatype,
    rawValue,
    predicates,
    arrayPaths
) {
    const expectMissing = rawValue === "true";
    const presenceFilters = buildPresenceFilters(
        searchType,
        fieldPath,
        datatype,
        predicates,
        arrayPaths
    );
    if (expectMissing) {
        return { $nor: presenceFilters };
    }
    return { $or: presenceFilters };
}

/**
 * @param {string} searchType
 * @param {string} fieldPath
 * @param {string} datatype
 * @param {{ kind: string, value?: string }[] | undefined} predicates
 * @param {string[] | undefined} arrayPaths
 * @returns {Object[]}
 */
function buildPresenceFilters(searchType, fieldPath, datatype, predicates, arrayPaths) {
    if (TEMPORAL_DATATYPES.has(datatype) && (searchType === "date" || searchType === "dateTime")) {
        return [
            correlateTemporalFilter(
                buildCanonicalTemporalPresenceFilter(fieldPath, datatype),
                fieldPath,
                arrayPaths
            )
        ];
    }
    if (datatype === "Period" && (searchType === "date" || searchType === "dateTime")) {
        return [buildPeriodPresenceFilter(fieldPath, arrayPaths)];
    }

    const systemPredicate = findPredicate(predicates, "systemEquals");
    if (systemPredicate?.value) {
        return [
            {
                [fieldPath]: {
                    $elemMatch: {
                        system: systemPredicate.value,
                        value: { $exists: true, $nin: [null, ""] }
                    }
                }
            }
        ];
    }

    if (findPredicate(predicates, "deceasedPresence")) {
        return [
            { deceasedBoolean: { $exists: true, $ne: null } },
            { deceasedDateTime: { $exists: true, $ne: null } }
        ];
    }

    if (datatype === "Address") {
        return ADDRESS_STRING_FIELDS.map((leaf) => ({
            [`${fieldPath}.${leaf}`]: { $exists: true, $nin: [null, ""] }
        }));
    }
    if (datatype === "HumanName") {
        return HUMAN_NAME_STRING_FIELDS.map((leaf) => ({
            [`${fieldPath}.${leaf}`]: { $exists: true, $nin: [null, ""] }
        }));
    }
    if (datatype === "CodeableConcept") {
        return [
            { [`${fieldPath}.coding.code`]: { $exists: true, $nin: [null, ""] } },
            { [`${fieldPath}.coding.system`]: { $exists: true, $nin: [null, ""] } }
        ];
    }
    if (datatype === "Identifier" || datatype === "ContactPoint") {
        return [
            { [`${fieldPath}.value`]: { $exists: true, $nin: [null, ""] } },
            { [`${fieldPath}.system`]: { $exists: true, $nin: [null, ""] } }
        ];
    }
    if (datatype === "Reference") {
        return [{ [`${fieldPath}.reference`]: { $exists: true, $nin: [null, ""] } }];
    }

    return [{ [fieldPath]: { $exists: true, $nin: [null, ""] } }];
}

/**
 * @param {string} fieldPath
 * @param {string[] | undefined} arrayPaths
 * @returns {Object}
 */
function buildPeriodPresenceFilter(fieldPath, arrayPaths) {
    const startField = `${fieldPath}.start`;
    const endField = `${fieldPath}.end`;
    const startPresence = buildCanonicalTemporalPresenceFilter(
        startField,
        "dateTime",
        false
    );
    const endPresence = buildCanonicalTemporalPresenceFilter(
        endField,
        "dateTime",
        false
    );
    const filter = {
        $and: [
            { $or: [{ [startField]: { $exists: false } }, startPresence] },
            { $or: [{ [endField]: { $exists: false } }, endPresence] },
            { $or: [{ [startField]: { $exists: true } }, { [endField]: { $exists: true } }] }
        ],
        $expr: {
            $function: {
                body: CANONICAL_TEMPORAL_VALIDATOR_BODY.toString(),
                args: [`$${fieldPath}`, "Period"],
                lang: "js"
            }
        }
    };

    return correlateTemporalFilter(filter, fieldPath, arrayPaths);
}

/**
 * @param {string} fieldPath
 * @param {"date" | "dateTime" | "instant"} datatype
 * @returns {Object}
 */
function buildCanonicalTemporalPresenceFilter(fieldPath, datatype, includeValidator = true) {
    const valueField = `${fieldPath}.value`;
    const precisionField = `${fieldPath}.precision`;
    const valuePattern =
        datatype === "date"
            ? DATE_PATTERN
            : datatype === "dateTime"
              ? DATETIME_PATTERN
              : INSTANT_PATTERN;
    const precisionValues =
        datatype === "date"
            ? [...DATE_PRECISION_VALUES]
            : datatype === "dateTime"
              ? [...DATETIME_PRECISION_VALUES]
              : [...INSTANT_PRECISION_VALUES];
    const normalizedFields =
        datatype === "date"
            ? [
                  [`${fieldPath}.normalizedStart`, "string"],
                  [`${fieldPath}.normalizedEnd`, "string"]
              ]
            : datatype === "dateTime"
              ? [
                    [`${fieldPath}.normalizedStart`, "decimal"],
                    [`${fieldPath}.normalizedEnd`, "decimal"]
                ]
              : [[`${fieldPath}.epochSeconds`, "decimal"]];
    const filter = {
        $and: [
            { [valueField]: { $exists: true, $type: "string", $regex: valuePattern } },
            {
                [precisionField]: {
                    $exists: true,
                    $type: "string",
                    $in: precisionValues
                }
            },
            ...normalizedFields.map(([field, type]) => ({
                [field]: { $exists: true, $type: type }
            }))
        ]
    };

    if (datatype === "date") {
        filter.$and.push(
            { [`${fieldPath}.normalizedStart`]: { $regex: /^\d{4}-\d{2}-\d{2}$/ } },
            { [`${fieldPath}.normalizedEnd`]: { $regex: /^\d{4}-\d{2}-\d{2}$/ } }
        );
    }

    if (datatype === "dateTime" || datatype === "instant") {
        const fractionPrecision = "fraction";
        const nonFractionPrecisions = precisionValues.filter(
            (precision) => precision !== fractionPrecision
        );
        filter.$and.push({
            $or: [
                {
                    [precisionField]: { $in: nonFractionPrecisions },
                    [`${fieldPath}.fractionDigits`]: { $exists: false }
                },
                {
                    [precisionField]: fractionPrecision,
                    [`${fieldPath}.fractionDigits`]: {
                        $exists: true,
                        $type: ["int", "long", "double", "decimal"],
                        $gt: 0
                    }
                }
            ]
        });
    }

    if (includeValidator) {
        filter.$and.push({
            $expr: {
                $function: {
                    body: CANONICAL_TEMPORAL_VALIDATOR_BODY.toString(),
                    args: [`$${fieldPath}`, datatype],
                    lang: "js"
                }
            }
        });
    }

    return filter;
}

/**
 * @param {string} value
 * @param {string} fieldPath
 * @param {string} datatype
 * @param {string | undefined} modifier
 * @returns {Object}
 */
function buildStringProjection(value, fieldPath, datatype, modifier) {
    const queryKey = modifier ? `${fieldPath}:${modifier}` : fieldPath;
    const stringMatcher = stringQuery(value, queryKey);

    if (datatype === "Address") {
        return {
            $or: ADDRESS_STRING_FIELDS.map((leaf) => ({
                [`${fieldPath}.${leaf}`]: stringMatcher
            }))
        };
    }
    if (datatype === "HumanName") {
        return {
            $or: HUMAN_NAME_STRING_FIELDS.map((leaf) => ({
                [`${fieldPath}.${leaf}`]: stringMatcher
            }))
        };
    }

    return { [fieldPath]: stringMatcher };
}

/**
 * @param {string} value
 * @param {string} fieldPath
 * @param {string} datatype
 * @param {string | undefined} modifier
 * @param {{ kind: string, value?: string }[] | undefined} predicates
 * @returns {Object}
 */
function buildTokenProjection(value, fieldPath, datatype, modifier, predicates) {
    const systemPredicate = findPredicate(predicates, "systemEquals");
    if (systemPredicate?.value && datatype === "ContactPoint") {
        return buildCorrelatedContactPointFilter(fieldPath, systemPredicate.value, value, modifier);
    }

    if (findPredicate(predicates, "deceasedPresence")) {
        return buildDeceasedTokenFilter(value, fieldPath, datatype);
    }

    if (modifier === "text" && datatype === "CodeableConcept") {
        return { [`${fieldPath}.text`]: value };
    }

    if (datatype === "CodeableConcept") {
        return tokenQuery(value, "coding.code", fieldPath, "", true);
    }
    if (datatype === "Coding") {
        return {
            $or: [
                tokenQuery(value, "code", fieldPath),
                tokenQuery(value, "system", fieldPath)
            ]
        };
    }
    if (datatype === "Identifier" || datatype === "ContactPoint") {
        return {
            $or: [
                tokenQuery(value, "value", fieldPath),
                tokenQuery(value, "system", fieldPath)
            ]
        };
    }

    return tokenQuery(value, "", fieldPath, "");
}

/**
 * @param {string} fieldPath
 * @param {string} systemValue
 * @param {string} value
 * @param {string | undefined} modifier
 * @returns {Object}
 */
function buildCorrelatedContactPointFilter(fieldPath, systemValue, value, modifier) {
    const valueMatcher = tokenQuery(value, "value", fieldPath, modifier || "", false);
    const matchedValue = valueMatcher[`${fieldPath}.value`] ?? valueMatcher.value ?? value;
    return {
        [fieldPath]: {
            $elemMatch: {
                system: systemValue,
                value: matchedValue
            }
        }
    };
}

/**
 * @param {string} value
 * @param {string} fieldPath
 * @param {string} datatype
 * @returns {Object}
 */
function buildDeceasedTokenFilter(value, fieldPath, datatype) {
    const normalized = String(value).toLowerCase();
    if (normalized === "true") {
        if (datatype === "dateTime") {
            return { [fieldPath]: { $exists: true, $ne: null } };
        }
        return { [fieldPath]: true };
    }
    if (normalized === "false") {
        if (datatype === "dateTime") {
            return { _id: { $exists: false } };
        }
        return { [fieldPath]: false };
    }
    return tokenQuery(value, "", fieldPath, "");
}

/**
 * @param {string} value
 * @param {string} fieldPath
 * @param {string} datatype
 * @param {string | undefined} comparator
 * @param {string} searchType
 * @param {import('./temporalQueryParser').TemporalQueryValue | undefined} [temporal]
 * @param {string[] | undefined} [arrayPaths]
 * @returns {Object}
 */
function buildDateProjection(
    value,
    fieldPath,
    datatype,
    comparator,
    searchType,
    temporal,
    arrayPaths
) {
    if (!hasSearchTypeProjection(searchType, datatype)) {
        throw new Error(`No search-type projection for ${searchType} on ${datatype}`);
    }
    if (datatype === "Period") {
        const typedTemporal = temporal ?? parseTemporalQueryValue(value, searchType);
        return buildPeriodTemporalFilter(
            fieldPath,
            typedTemporal,
            comparator ?? typedTemporal.comparator,
            arrayPaths
        );
    }
    if (TEMPORAL_DATATYPES.has(datatype)) {
        const typedTemporal = temporal ?? parseTemporalQueryValue(value, searchType);
        return buildTemporalFilter(
            fieldPath,
            datatype,
            typedTemporal,
            comparator ?? typedTemporal.comparator,
            arrayPaths
        );
    }

    throw new Error(`No temporal projection for ${searchType} on ${datatype}`);
}

/**
 * @param {string} value
 * @param {string} fieldPath
 * @param {string | undefined} comparator
 * @returns {Object}
 */
function buildQuantityProjection(value, fieldPath, comparator) {
    const prefixedValue =
        comparator && comparator !== "eq" ? `${comparator}${value}` : value;
    const result = quantityQuery(prefixedValue, fieldPath);
    if (!result) {
        throw new Error(`invalid quantity: ${value}`);
    }
    return result;
}

/**
 * @param {string} value
 * @param {string} fieldPath
 * @param {string | undefined} comparator
 * @returns {Object}
 */
function buildNumberProjection(value, fieldPath, comparator) {
    const prefixedValue =
        comparator && comparator !== "eq" ? `${comparator}${value}` : value;
    const result = numberQuery(prefixedValue, fieldPath);
    if (!result) {
        throw new Error(`invalid number: ${value}`);
    }
    return result;
}

/**
 * @param {string} value
 * @param {string} fieldPath
 * @param {string | undefined} modifier
 * @returns {Object}
 */
function buildUriProjection(value, fieldPath, modifier) {
    const queryKey = modifier ? `${fieldPath}:${modifier}` : fieldPath;
    return { [fieldPath]: uriQuery(value, queryKey) };
}

/**
 * @param {string} value
 * @param {string} fieldPath
 * @param {string} datatype
 * @param {string | undefined} referenceTargetType
 * @param {{ kind: string, value?: string }[] | undefined} predicates
 * @returns {Object}
 */
function buildReferenceProjection(value, fieldPath, datatype, referenceTargetType, predicates) {
    const validation = validateReferenceQueryValue(value);
    if (!validation.valid) {
        throw new Error(validation.reason || "Invalid reference value");
    }

    const normalized = normalizeReferenceQueryValue(value, referenceTargetType);
    if (!normalized.valid || !normalized.normalizedValue) {
        throw new Error(normalized.reason || "Invalid reference value");
    }

    const referenceValue = normalized.normalizedValue;
    const typePredicate = findPredicate(predicates, "typeEquals");
    if (typePredicate?.value) {
        const arrayField = fieldPath.split(".")[0];
        const leafField = fieldPath.slice(arrayField.length + 1);
        const matcher = referenceQuery(referenceValue, fieldPath);
        const matchedValue = matcher[fieldPath] ?? referenceValue;
        return {
            [arrayField]: {
                $elemMatch: {
                    type: typePredicate.value,
                    [leafField]: matchedValue
                }
            }
        };
    }

    if (datatype === "canonical" || datatype === "uri") {
        return referenceQuery(referenceValue, fieldPath);
    }

    if (datatype === "Resource") {
        return referenceQuery(referenceValue, `${fieldPath}.reference`);
    }

    const targetType = referenceTargetType;
    const referenceField = `${fieldPath}.reference`;
    const typeField = `${fieldPath}.type`;
    const referenceMatcher = referenceQuery(referenceValue, referenceField);

    if (!targetType) {
        return referenceMatcher;
    }

    const scalarGuard = {
        $and: [
            referenceMatcher,
            {
                $or: [{ [typeField]: { $exists: false } }, { [typeField]: targetType }]
            }
        ]
    };
    const arrayGuard = {
        [fieldPath]: {
            $elemMatch: {
                reference: referenceMatcher[referenceField] || referenceValue,
                $or: [{ type: { $exists: false } }, { type: targetType }]
            }
        }
    };

    return {
        $or: [scalarGuard, arrayGuard]
    };
}

/**
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @param {string} value
 * @param {string | undefined} modifier
 * @param {string | undefined} comparator
 * @param {import('./temporalQueryParser').TemporalQueryValue | undefined} [temporal]
 * @returns {Object}
 */
function buildDeceasedCombinedFilter(plan, value, modifier, comparator, temporal) {
    const branchFilters = plan.extractionPaths
        .map((entry) =>
            buildProjectedFilter(
                plan.searchType,
                value,
                entry.path,
                entry.datatype,
                modifier,
                comparator,
                entry.referenceTargetType,
                entry.predicates,
                temporal,
                entry.arrayPaths
            )
        )
        .filter((filter) => !filter._id || filter._id.$exists !== false);

    if (String(value).toLowerCase() === "false") {
        const booleanBranch = branchFilters.find((entry) => entry.deceasedBoolean !== undefined);
        return booleanBranch || { deceasedBoolean: false };
    }

    if (branchFilters.length === 0) {
        return { _id: { $exists: false } };
    }
    if (branchFilters.length === 1) {
        return branchFilters[0];
    }
    return { $or: branchFilters };
}

module.exports = {
    hasSearchTypeProjection,
    buildProjectedFilter,
    buildDeceasedCombinedFilter,
    buildCorrelatedContactPointFilter,
    ADDRESS_STRING_FIELDS,
    HUMAN_NAME_STRING_FIELDS
};
