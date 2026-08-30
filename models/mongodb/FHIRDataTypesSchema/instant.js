const mongoose = require("mongoose");
const {
    validateCanonicalInstant
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
    validate: {
        validator: function(v) {
            return validateCanonicalInstant(v).valid;
        },
        message: (props) => {
            const result = validateCanonicalInstant(props.value);
            return result.errors.join("; ");
        }
    }
};