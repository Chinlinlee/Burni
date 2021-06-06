const moment = require('moment');
module.exports = {
    type: Date,
    get: function(v) {
        return moment(v).format('YYYY-MM-DDThh:mm:ss.SSSZ');
    } ,
    default: void 0,
}