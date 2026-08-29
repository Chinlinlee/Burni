const { ADDRESS_STRING_FIELDS, HUMAN_NAME_STRING_FIELDS } = require("../executor/searchTypeProjection");

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isPresent(value) {
    return value !== undefined && value !== null && value !== "";
}

/**
 * @param {Object} document
 * @param {string} path
 * @returns {unknown[]}
 */
function collectValuesAtPath(document, path) {
    const segments = path.split(".");
    /** @type {unknown[]} */
    let current = [document];

    for (let index = 0; index < segments.length; index += 1) {
        const segment = segments[index];
        const isLast = index === segments.length - 1;
        /** @type {unknown[]} */
        const next = [];
        for (const item of current) {
            if (item == null) {
                continue;
            }
            if (Array.isArray(item)) {
                for (const element of item) {
                    if (element != null && segment in element) {
                        next.push(element[segment]);
                    }
                }
            } else if (typeof item === "object" && segment in item) {
                next.push(item[segment]);
            }
        }
        if (next.length === 0) {
            return [];
        }
        if (isLast) {
            /** @type {unknown[]} */
            const flattened = [];
            for (const value of next) {
                if (Array.isArray(value)) {
                    flattened.push(...value);
                } else {
                    flattened.push(value);
                }
            }
            return flattened.filter(isPresent);
        }
        current = next;
    }

    return current.filter(isPresent);
}

/**
 * @param {string} code
 * @returns {string | null}
 */
function addressFieldForCode(code) {
    const mapping = {
        "address-city": "city",
        "address-country": "country",
        "address-postalcode": "postalCode",
        "address-state": "state",
        "address-use": "use"
    };
    return mapping[code] || null;
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function formatDateValue(value) {
    if (value instanceof Date) {
        return value.toISOString().slice(0, 10);
    }
    if (typeof value === "string") {
        return value.slice(0, 10);
    }
    return null;
}

/**
 * @param {unknown} value
 * @param {string} datatype
 * @param {string} code
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @param {import('../compiler/searchQueryPlan').ExtractionPath} [extractionPath]
 * @returns {string | null}
 */
function formatSearchValue(value, datatype, code, plan, extractionPath) {
    if (!isPresent(value)) {
        return null;
    }

    switch (plan.searchType) {
        case "string": {
            if (datatype === "Address" && typeof value === "object") {
                const field = addressFieldForCode(code);
                if (field && isPresent(value[field])) {
                    return String(value[field]);
                }
                for (const leaf of ADDRESS_STRING_FIELDS) {
                    if (isPresent(value[leaf])) {
                        return String(value[leaf]);
                    }
                }
                return null;
            }
            if (datatype === "HumanName" && typeof value === "object") {
                for (const leaf of HUMAN_NAME_STRING_FIELDS) {
                    if (leaf === "given" && Array.isArray(value.given) && value.given.length > 0) {
                        return String(value.given[0]);
                    }
                    if (isPresent(value[leaf])) {
                        return String(value[leaf]);
                    }
                }
                return null;
            }
            return String(value);
        }
        case "token": {
            if (datatype === "CodeableConcept" && typeof value === "object") {
                const coding = Array.isArray(value.coding) ? value.coding[0] : null;
                if (!coding) {
                    return isPresent(value.text) ? String(value.text) : null;
                }
                if (isPresent(coding.system) && isPresent(coding.code)) {
                    return `${coding.system}|${coding.code}`;
                }
                return isPresent(coding.code) ? String(coding.code) : null;
            }
            if (datatype === "Coding" && typeof value === "object") {
                if (isPresent(value.system) && isPresent(value.code)) {
                    return `${value.system}|${value.code}`;
                }
                return isPresent(value.code) ? String(value.code) : null;
            }
            if ((datatype === "Identifier" || datatype === "ContactPoint") && typeof value === "object") {
                if (isPresent(value.system) && isPresent(value.value)) {
                    return `${value.system}|${value.value}`;
                }
                return isPresent(value.value) ? String(value.value) : null;
            }
            if (datatype === "boolean") {
                return value === true ? "true" : value === false ? "false" : null;
            }
            return String(value);
        }
        case "reference": {
            if (typeof value === "object" && isPresent(value.reference)) {
                const reference = String(value.reference);
                if (reference.startsWith("#")) {
                    return null;
                }
                const targetType = extractionPath?.referenceTargetType;
                if (targetType) {
                    const [resourcePrefix] = reference.split("/");
                    if (resourcePrefix !== targetType) {
                        return null;
                    }
                }
                return reference;
            }
            return typeof value === "string" && !value.startsWith("#") ? value : null;
        }
        case "date":
        case "dateTime": {
            if (datatype === "Period" && typeof value === "object") {
                return formatDateValue(value.start || value.end);
            }
            return formatDateValue(value);
        }
        case "quantity": {
            if (typeof value === "object") {
                const amount = value.value;
                const unit = value.code || value.unit;
                if (isPresent(amount) && isPresent(unit)) {
                    return `${amount}|${unit}`;
                }
                return isPresent(amount) ? String(amount) : null;
            }
            return String(value);
        }
        case "number":
            return String(value);
        case "uri":
            try {
                // eslint-disable-next-line no-new
                new URL(String(value));
                return String(value);
            } catch {
                return null;
            }
        default:
            return null;
    }
}

/**
 * @param {Object} document
 * @param {import('../compiler/searchQueryPlan').SearchQueryPlan} plan
 * @returns {string | null}
 */
function extractSearchValue(document, plan) {
    for (const entry of plan.extractionPaths) {
        const values = collectValuesAtPath(document, entry.path);
        for (const value of values) {
            const formatted = formatSearchValue(value, entry.datatype, plan.code, plan, entry);
            if (formatted) {
                return formatted;
            }
        }
    }
    return null;
}

module.exports = {
    collectValuesAtPath,
    extractSearchValue,
    formatSearchValue,
    addressFieldForCode
};
