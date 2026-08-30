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
const { isCalendarDate, compareCalendarDates, expectedDateBoundaries } = require("./calendar");
const { isDecimal128, compareDecimal128 } = require("./decimal128");
const {
    validateCanonicalDate,
    validateCanonicalDateTime,
    validateCanonicalInstant
} = require("./validate");
const {
    normalizeDate,
    normalizeDateTime,
    normalizeInstant,
    normalizeTemporal
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
    normalizeDateSafe,
    normalizeDateTimeSafe,
    normalizeInstantSafe,
    normalizeTemporalSafe
} = require("./errors");

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
    isDecimal128,
    compareDecimal128,
    validateCanonicalDate,
    validateCanonicalDateTime,
    validateCanonicalInstant,
    normalizeDate,
    normalizeDateTime,
    normalizeInstant,
    normalizeTemporal,
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
    normalizeDateSafe,
    normalizeDateTimeSafe,
    normalizeInstantSafe,
    normalizeTemporalSafe
};
