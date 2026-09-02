const {
    DATE_PRECISION,
    DATETIME_PRECISION,
    INSTANT_PRECISION,
    DATE_PATTERN,
    DATETIME_PATTERN,
    INSTANT_PATTERN,
    DATE_PRECISION_VALUES,
    DATETIME_PRECISION_VALUES,
    INSTANT_PRECISION_VALUES,
    CALENDAR_DATE_PATTERN,
    CANONICAL_DATE_FIELDS,
    CANONICAL_DATETIME_FIELDS,
    CANONICAL_INSTANT_FIELDS
} = require("./constants");
const {
    inferDatePrecision,
    inferDateTimePrecision,
    inferInstantPrecision
} = require("./lexical");
const { isCalendarDate, compareCalendarDates, expectedDateBoundaries, addCalendarDays } =
    require("./calendar");
const { parseDecimal, formatDecimal, addDecimal, divideDecimalByTen } = require("./arithmetic");
const { isDecimal128, compareDecimal128 } = require("./decimal128");
const {
    validateCanonicalDate,
    validateCanonicalDateTime,
    validateCanonicalInstant,
    toPlainCanonicalValue
} = require("./validate");
const {
    normalizeDate,
    normalizeDateTime,
    normalizeInstant,
    normalizeTemporal,
    canonicalInstantFromUtcDate
} = require("./normalizer");
const {
    serializeDate,
    serializeDateTime,
    serializeInstant,
    serializeTemporal,
    isCanonicalTemporalObject
} = require("./serializer");
const {
    TEMPORAL_ERROR_CODE,
    TemporalValidationError,
    assertPublicTemporalScalar,
    mapNormalizerError,
    temporalErrorToOperationOutcome,
    temporalErrorToFhirValidationError,
    temporalErrorToWriteFailure,
    normalizeDateSafe,
    normalizeDateTimeSafe,
    normalizeInstantSafe,
    normalizeTemporalSafe
} = require("./errors");
const {
    normalizeResourceTemporals,
    serializeResourceTemporals,
    toHttpLastModified
} = require("./resource");

module.exports = {
    DATE_PRECISION,
    DATETIME_PRECISION,
    INSTANT_PRECISION,
    DATE_PATTERN,
    DATETIME_PATTERN,
    INSTANT_PATTERN,
    DATE_PRECISION_VALUES,
    DATETIME_PRECISION_VALUES,
    INSTANT_PRECISION_VALUES,
    CALENDAR_DATE_PATTERN,
    CANONICAL_DATE_FIELDS,
    CANONICAL_DATETIME_FIELDS,
    CANONICAL_INSTANT_FIELDS,
    inferDatePrecision,
    inferDateTimePrecision,
    inferInstantPrecision,
    isCalendarDate,
    compareCalendarDates,
    expectedDateBoundaries,
    addCalendarDays,
    parseDecimal,
    formatDecimal,
    addDecimal,
    divideDecimalByTen,
    isDecimal128,
    compareDecimal128,
    validateCanonicalDate,
    validateCanonicalDateTime,
    validateCanonicalInstant,
    toPlainCanonicalValue,
    normalizeDate,
    normalizeDateTime,
    normalizeInstant,
    normalizeTemporal,
    canonicalInstantFromUtcDate,
    serializeDate,
    serializeDateTime,
    serializeInstant,
    serializeTemporal,
    isCanonicalTemporalObject,
    TEMPORAL_ERROR_CODE,
    TemporalValidationError,
    assertPublicTemporalScalar,
    mapNormalizerError,
    temporalErrorToOperationOutcome,
    temporalErrorToFhirValidationError,
    temporalErrorToWriteFailure,
    normalizeDateSafe,
    normalizeDateTimeSafe,
    normalizeInstantSafe,
    normalizeTemporalSafe,
    normalizeResourceTemporals,
    serializeResourceTemporals,
    toHttpLastModified
};
