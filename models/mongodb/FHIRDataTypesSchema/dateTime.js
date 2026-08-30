const mongoose = require("mongoose");
const {
    validateCanonicalDateTime
} = require("../../FHIR/temporal");
const {
    DATETIME_PRECISION
} = require("../../FHIR/temporal/constants");

module.exports = {
    type: {
        value: {
            type: String,
            required: true
        },
        precision: {
            type: String,
            enum: Object.values(DATETIME_PRECISION),
            required: true
        },
        fractionDigits: {
            type: Number,
            default: void 0
        },
        normalizedStart: {
            type: mongoose.Schema.Types.Decimal128,
            required: true
        },
        normalizedEnd: {
            type: mongoose.Schema.Types.Decimal128,
            required: true
        }
    },
    _id: false,
    default: void 0,
    validate: {
        validator: function(v) {
            return validateCanonicalDateTime(v).valid;
        },
        message: (props) => {
            const result = validateCanonicalDateTime(props.value);
            return result.errors.join("; ");
        }
    }
};