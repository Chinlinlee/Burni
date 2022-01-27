module.exports = {
    type: Boolean,
    validate: {
        validator: function(v) {
            return /^true|false$/.test(v);
        },
        message: props => `${props.value} is not a valid boolean!`
    },
    default: void 0
};