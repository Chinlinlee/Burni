const ELEMENT_REF = "#/definitions/Element";

/**
 * @param {string} fieldName
 * @param {Record<string, unknown>} property
 * @param {Record<string, unknown>} properties
 * @returns {{ yes: boolean, isArray: boolean }}
 */
function resolveElementExtensionField(fieldName, property, properties) {
    if (!fieldName.startsWith("_")) {
        return { yes: false, isArray: false };
    }

    const baseField = fieldName.slice(1);
    if (!Object.prototype.hasOwnProperty.call(properties, baseField)) {
        return { yes: false, isArray: false };
    }

    if (property.$ref === ELEMENT_REF) {
        return { yes: true, isArray: false };
    }

    if (
        property.type === "array" &&
        property.items &&
        property.items.$ref === ELEMENT_REF
    ) {
        return { yes: true, isArray: true };
    }

    return { yes: false, isArray: false };
}

/**
 * @param {boolean} isArray
 * @returns {string}
 */
function formatElementExtensionField(isArray) {
    const schemaExpr = `new mongoose.Schema(
        {
            extension: {
                type: [Extension],
                default: void 0
            }
        },
        {
            _id: false,
            id: false,
            toObject: {
                getters: true
            }
        }
    )`;

    if (isArray) {
        return `{
        type: [${schemaExpr}],
        default: void 0
    }`;
    }

    return `{
        type: ${schemaExpr},
        default: void 0
    }`;
}

module.exports = {
    resolveElementExtensionField,
    formatElementExtensionField
};
