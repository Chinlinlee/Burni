/**
 * @typedef {'correction' | 'structural-divergence' | 'incompatible-branch-omission'} CompatibilityCategory
 * @typedef {{ category: CompatibilityCategory, reason: string }} CompatibilityEntry
 */

/** @type {Record<string, CompatibilityEntry>} */
const EXPECTED_LEGACY_DIVERGENCES = {
    "Patient::deceased": {
        category: "correction",
        reason: "Registry searches both deceasedBoolean and deceasedDateTime choice branches."
    },
    "Patient::email": {
        category: "correction",
        reason: "Registry correlates ContactPoint system=email with the searched value."
    },
    "Patient::phone": {
        category: "correction",
        reason: "Registry correlates ContactPoint system=phone with the searched value."
    },
    "Patient::identifier": {
        category: "correction",
        reason: "Registry keeps the bare system token branch for identifier searches."
    },
    "Patient::telecom": {
        category: "correction",
        reason: "Registry also matches telecom.system in addition to telecom.value."
    },
    "Patient::phonetic": {
        category: "correction",
        reason: "Registry searches HumanName leaf fields instead of the whole name object."
    },
    "Patient::name": {
        category: "structural-divergence",
        reason: "Registry flattens the HumanName OR branches without changing the hit-set."
    },
    "Observation::value-quantity": {
        category: "incompatible-branch-omission",
        reason: "Registry omits the incompatible SampledData union branch."
    }
};

/** @type {readonly string[]} */
const ENABLEMENT_GATES = Object.freeze([
    "golden-filter",
    "document-hit-set",
    "operator-multiplicity",
    "diagnostics",
    "structural-registry"
]);

/** @type {readonly string[]} */
const NON_GOALS = Object.freeze([
    "Address.text string projection",
    "full R4 phonetic matching",
    "Period overlap date semantics",
    "CodeableConcept.text token matching",
    "SampledData quantity bounds"
]);

/**
 * @param {string} lookupKey
 * @returns {boolean}
 */
function isExpectedLegacyDivergence(lookupKey) {
    return Object.prototype.hasOwnProperty.call(EXPECTED_LEGACY_DIVERGENCES, lookupKey);
}

/**
 * @returns {string[]}
 */
function getExpectedLegacyDivergenceKeys() {
    return Object.keys(EXPECTED_LEGACY_DIVERGENCES);
}

/**
 * @param {string} lookupKey
 * @returns {CompatibilityEntry | null}
 */
function getExpectedLegacyDivergence(lookupKey) {
    return EXPECTED_LEGACY_DIVERGENCES[lookupKey] || null;
}

/**
 * @returns {readonly string[]}
 */
function getEnablementGates() {
    return ENABLEMENT_GATES;
}

/**
 * @returns {readonly string[]}
 */
function getCompatibilityNonGoals() {
    return NON_GOALS;
}

/**
 * Legacy Mongo filter JSON equality is diagnostic-only and MUST NOT gate enablement.
 * @returns {boolean}
 */
function usesLegacyFilterEqualityAsEnablementGate() {
    return false;
}

module.exports = {
    EXPECTED_LEGACY_DIVERGENCES,
    ENABLEMENT_GATES,
    NON_GOALS,
    isExpectedLegacyDivergence,
    getExpectedLegacyDivergenceKeys,
    getExpectedLegacyDivergence,
    getEnablementGates,
    getCompatibilityNonGoals,
    usesLegacyFilterEqualityAsEnablementGate
};
