module.exports = {
    type: String,
    validate: {
        validator: function(v) {
            return /^[ \r\n\t\S]+$/.test(v);
        },
        message: props => `${props.value} is not a valid markdown!`
    },
    default: void 0
};