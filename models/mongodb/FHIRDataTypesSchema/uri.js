module.exports = {
    type: String,
    validate: {
        validator: function(v) {
            return /^\S*$/.test(v);
        },
        message: props => `${props.value} is not a valid uri!`
    },
    default: void 0
}