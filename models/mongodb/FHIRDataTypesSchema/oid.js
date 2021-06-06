module.exports = {
    type: String,
    validate: {
        validator: function(v) {
            return /^urn:oid:[0-2](\.(0|[1-9][0-9]*))+$/.test(v);
        },
        message: props => `${props.value} is not a valid oid!`
    },
    default: void 0
}