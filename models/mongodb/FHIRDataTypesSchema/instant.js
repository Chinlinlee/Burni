const mongoose = require("mongoose");
const {
    validateCanonicalInstant,
    canonicalInstantFromUtcDate,
    toPlainCanonicalValue
} = require("../../FHIR/temporal");
const {
    INSTANT_PRECISION
} = require("../../FHIR/temporal/constants");

module.exports = {
    type: {
        value: {
            type: String,
            required: true
        },
        precision: {
            type: String,
            enum: Object.values(INSTANT_PRECISION),
            required: true
        },
        fractionDigits: {
            type: Number,
            default: void 0
        },
        epochSeconds: {
            type: mongoose.Schema.Types.Decimal128,
            required: true
        }
    },
    _id: false,
    default: void 0,
    set: function(v) {
        if (v instanceof Date) {
            return canonicalInstantFromUtcDate(v);
        }
        if (typeof v === "number" && Number.isFinite(v)) {
            return canonicalInstantFromUtcDate(new Date(v));
        }
        return v;
    },
    validate: {
        validator: function(v) {
            return validateCanonicalInstant(toPlainCanonicalValue(v)).valid;
        },
        message: (props) => {
            const result = validateCanonicalInstant(toPlainCanonicalValue(props.value));
            return result.errors.join("; ");
        }
    }
};