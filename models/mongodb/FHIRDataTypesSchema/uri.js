module.exports = {
    type: String,
    validate: {
        validator: function(v) {
            return /^\S*$/.test(v);
        },
        message: props => `${props.value} is not a valid uri!`
    },
    get : (v) => {
        if (v) return encodeURI(v);
    },
    default: void 0
}