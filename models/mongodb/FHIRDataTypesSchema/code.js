module.exports = {
    type: String,
    validate: {
        validator: function(v) {
            return /^[^\s]+(\s[^\s]+)*$/.test(v);
        },
        message: props => `${props.value} is not a valid code!`
    },
    default: void 0
}