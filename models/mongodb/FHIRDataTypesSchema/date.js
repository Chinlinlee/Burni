const {
    validateCanonicalDate
} = require("../../FHIR/temporal");
const {
    DATE_PRECISION
} = require("../../FHIR/temporal/constants");

module.exports = {
    type: {
        value: {
            type: String,
            required: true
        },
        precision: {
            type: String,
            enum: Object.values(DATE_PRECISION),
            required: true
        },
        normalizedStart: {
            type: String,
            required: true
        },
        normalizedEnd: {
            type: String,
            required: true
        }
    },
    _id: false,
    default: void 0,
    validate: {
        validator: function(v) {
            return validateCanonicalDate(v).valid;
        },
        message: (props) => {
            const result = validateCanonicalDate(props.value);
            return result.errors.join("; ");
        }
    }
};