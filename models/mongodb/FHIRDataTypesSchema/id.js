module.exports = {
    type: String,
    validate: {
        validator: function(v) {
            return /^[A-Za-z0-9\-\.]{1,64}$/.test(v);
        },
        message: props => `${props.value} is not a valid id!`
    },
    default: void 0 ,
    index : true
}