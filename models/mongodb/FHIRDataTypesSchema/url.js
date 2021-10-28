module.exports = {
    type: String,
    validate: {
        validator: function(v) {
            return /^\S*$/.test(v);
        },
        message: props => `${props.value} is not a valid url!`
    },
    get : function(v) {
        return encodeURI(v);
    },
    default: void 0
}