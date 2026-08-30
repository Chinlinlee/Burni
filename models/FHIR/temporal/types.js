/**
 * @typedef {'year' | 'month' | 'day'} DatePrecision
 */

/**
 * @typedef {'year' | 'month' | 'day' | 'minute' | 'second' | 'fraction'} DateTimePrecision
 */

/**
 * @typedef {'second' | 'fraction'} InstantPrecision
 */

/**
 * @typedef {Object} CanonicalDate
 * @property {string} value
 * @property {DatePrecision} precision
 * @property {string} normalizedStart
 * @property {string} normalizedEnd
 */

/**
 * @typedef {Object} CanonicalDateTime
 * @property {string} value
 * @property {DateTimePrecision} precision
 * @property {number} [fractionDigits]
 * @property {import('mongoose').Types.Decimal128} normalizedStart
 * @property {import('mongoose').Types.Decimal128} normalizedEnd
 */

/**
 * @typedef {Object} CanonicalInstant
 * @property {string} value
 * @property {InstantPrecision} precision
 * @property {number} [fractionDigits]
 * @property {import('mongoose').Types.Decimal128} epochSeconds
 */

/**
 * @typedef {Object} TemporalValidationResult
 * @property {boolean} valid
 * @property {string[]} errors
 */

module.exports = {};
