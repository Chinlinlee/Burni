module.exports = {
    type: Number,
    validate: {
        validator: function(v) {
            return /^-?([0]|([1-9][0-9]*))$/.test(v);
        },
        message: props => `${props.value} is not a valid integer!`
    },
    default: void 0
}