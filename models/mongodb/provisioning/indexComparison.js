"use strict";

const {
    INDEX_DRIFT_TYPES,
    INDEX_RECONCILE_STATUS
} = require("./contracts");
const {
    buildBaselineIndexIdentity,
    normalizeIndexOptions,
    sortIndexKey
} = require("./indexIdentity");

/**
 * @param {Record<string, unknown>} key
 * @returns {Record<string, number | string>}
 */
function normalizeActualIndexKey(key) {
    if (!key || typeof key !== "object" || Array.isArray(key)) {
        return {};
    }

    /** @type {Record<string, number | string>} */
    const normalized = {};
    for (const [field, direction] of Object.entries(key)) {
        if (typeof direction === "number" || typeof direction === "string") {
            normalized[field] = direction;
        }
    }
    return sortIndexKey(normalized);
}

/**
 * @param {Record<string, unknown>} spec
 * @returns {Record<string, unknown>}
 */
function normalizeActualIndexOptions(spec) {
    /** @type {Record<string, unknown>} */
    const options = {};

    if (spec.unique === true) {
        options.unique = true;
    }
    if (spec.sparse === true) {
        options.sparse = true;
    }
    if (spec.background === true) {
        options.background = true;
    }
    if (spec.partialFilterExpression) {
        options.partialFilterExpression = spec.partialFilterExpression;
    }
    if (spec.collation) {
        options.collation = spec.collation;
    }
    if (typeof spec.name === "string" && spec.name.length > 0) {
        options.name = spec.name;
    }

    return normalizeIndexOptions(options);
}

/**
 * @param {Record<string, number | string>} left
 * @param {Record<string, number | string>} right
 * @returns {boolean}
 */
function indexKeysEqual(left, right) {
    return JSON.stringify(sortIndexKey(left)) === JSON.stringify(sortIndexKey(right));
}

/**
 * @param {Record<string, number>} key
 * @returns {boolean}
 */
function isResourceIdIndexKey(key) {
    const entries = Object.entries(key || {});
    return entries.length === 1 && entries[0][0] === "id" && entries[0][1] === 1;
}

/**
 * @param {Record<string, unknown>} desiredOptions
 * @param {Record<string, unknown>} actualSpec
 * @returns {boolean}
 */
function optionsMatchForDrift(desiredOptions, actualSpec) {
    const actualOptions = normalizeActualIndexOptions(actualSpec);
    const normalizedDesired = normalizeIndexOptions(desiredOptions);

    delete normalizedDesired.background;
    delete actualOptions.background;

    if ((actualSpec.unique === true) !== (desiredOptions.unique === true)) {
        return false;
    }

    return JSON.stringify(normalizedDesired) === JSON.stringify(actualOptions);
}

/**
 * @param {import('./types').BaselineIndexContract | import('./types').DerivedIndexContract} desired
 * @param {Record<string, unknown>} actualSpec
 * @returns {{ status: string, drift?: import('./types').IndexDriftDetail, actualIdentity?: string }}
 */
function classifyDesiredAgainstActual(desired, actualSpec) {
    const actualKey = normalizeActualIndexKey(actualSpec.key);
    const actualOptions = normalizeActualIndexOptions(actualSpec);
    const actualIdentity = buildBaselineIndexIdentity(
        desired.collection,
        actualKey,
        actualOptions
    );

    if (!indexKeysEqual(desired.key, actualKey)) {
        return {
            status: INDEX_RECONCILE_STATUS.MISMATCH,
            actualIdentity,
            drift: {
                type: INDEX_DRIFT_TYPES.MISMATCH,
                expected: {
                    identity: desired.identity,
                    key: desired.key,
                    options: desired.options
                },
                actual: {
                    identity: actualIdentity,
                    key: actualKey,
                    options: actualOptions,
                    name: actualSpec.name
                },
                message: "Index key pattern does not match desired identity"
            }
        };
    }

    if (!optionsMatchForDrift(desired.options, actualSpec)) {
        const actualUnique = actualSpec.unique === true;
        const desiredUnique = desired.options.unique === true;
        const uniqueMismatch =
            isResourceIdIndexKey(desired.key) && !desiredUnique && actualUnique;

        return {
            status: INDEX_RECONCILE_STATUS.MISMATCH,
            actualIdentity,
            drift: {
                type: INDEX_DRIFT_TYPES.MISMATCH,
                expected: {
                    identity: desired.identity,
                    options: desired.options
                },
                actual: {
                    identity: actualIdentity,
                    options: actualOptions,
                    name: actualSpec.name
                },
                message: uniqueMismatch
                    ? "Existing id index is unique; provisioning will not downgrade or recreate it"
                    : "Index options do not match desired identity"
            }
        };
    }

    return {
        status: INDEX_RECONCILE_STATUS.COMPATIBLE,
        actualIdentity,
        drift: {
            type: INDEX_DRIFT_TYPES.COMPATIBLE,
            expected: { identity: desired.identity },
            actual: { identity: actualIdentity, name: actualSpec.name }
        }
    };
}

/**
 * @param {Array<import('./types').BaselineIndexContract | import('./types').DerivedIndexContract>} desiredIndexes
 * @param {Record<string, unknown>[]} actualIndexes
 * @returns {{ desired: Array<{ desired: import('./types').BaselineIndexContract | import('./types').DerivedIndexContract, actual?: Record<string, unknown>, status: string, drift?: import('./types').IndexDriftDetail }>, extra: Record<string, unknown>[] }}
 */
function classifyCollectionIndexes(desiredIndexes, actualIndexes) {
    const actualByName = new Map(
        actualIndexes
            .filter((entry) => typeof entry.name === "string")
            .map((entry) => [entry.name, entry])
    );
    /** @type {Set<string>} */
    const matchedActualNames = new Set(["_id_"]);
    /** @type {Array<{ desired: import('./types').BaselineIndexContract | import('./types').DerivedIndexContract, actual?: Record<string, unknown>, status: string, drift?: import('./types').IndexDriftDetail }>} */
    const desired = [];

    for (const desiredIndex of desiredIndexes) {
        let actual =
            actualByName.get(desiredIndex.name) ||
            actualIndexes.find(
                (entry) =>
                    typeof entry.name === "string" &&
                    entry.name !== "_id_" &&
                    indexKeysEqual(desiredIndex.key, normalizeActualIndexKey(entry.key))
            );

        if (!actual) {
            desired.push({
                desired: desiredIndex,
                status: INDEX_RECONCILE_STATUS.MISSING,
                drift: {
                    type: INDEX_DRIFT_TYPES.MISSING,
                    expected: {
                        identity: desiredIndex.identity,
                        name: desiredIndex.name,
                        key: desiredIndex.key,
                        options: desiredIndex.options
                    },
                    message: "Desired index is missing from MongoDB"
                }
            });
            continue;
        }

        matchedActualNames.add(actual.name);
        const classification = classifyDesiredAgainstActual(desiredIndex, actual);
        desired.push({
            desired: desiredIndex,
            actual,
            status: classification.status,
            drift: classification.drift
        });
    }

    const extra = actualIndexes.filter(
        (entry) => typeof entry.name === "string" && !matchedActualNames.has(entry.name)
    );

    return { desired, extra };
}

/**
 * @param {Array<import('./types').BaselineIndexContract | import('./types').DerivedIndexContract>} desiredIndexes
 * @returns {Map<string, Array<import('./types').BaselineIndexContract | import('./types').DerivedIndexContract>>}
 */
function groupDesiredIndexesByCollection(desiredIndexes) {
    /** @type {Map<string, Array<import('./types').BaselineIndexContract | import('./types').DerivedIndexContract>>} */
    const grouped = new Map();
    for (const index of desiredIndexes) {
        const bucket = grouped.get(index.collection) || [];
        bucket.push(index);
        grouped.set(index.collection, bucket);
    }
    return grouped;
}

module.exports = {
    normalizeActualIndexKey,
    normalizeActualIndexOptions,
    indexKeysEqual,
    isResourceIdIndexKey,
    classifyDesiredAgainstActual,
    classifyCollectionIndexes,
    groupDesiredIndexesByCollection
};
