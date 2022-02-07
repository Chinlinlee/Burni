module.exports = {
    type: String,
    validate: {
        validator: function(v) {
            return /^\S*$/.test(v);
        },
        message: props => `${props.value} is not a valid canonical!`
    },
    default: void 0
};