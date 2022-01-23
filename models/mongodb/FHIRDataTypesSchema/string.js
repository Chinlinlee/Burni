module.exports = {
    type: String,
    validate: {
        validator: function(v) {
            return /^[\r\n\t\u0020-\uFFFF]*/g.test(v);
        },
        message: props => `${props.value} is not a valid string!`
    },
    default: void 0
}