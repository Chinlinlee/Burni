module.exports = {
    type: String,
    validate: {
        validator: function(v) {
            return /^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(v);
        },
        message: props => `${props.value} is not a valid uuid!`
    },
    default: void 0
}