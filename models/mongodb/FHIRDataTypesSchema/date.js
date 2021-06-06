const moment = require('moment');
module.exports = {
    type: Date,
    default: void 0,
    get: function(v) {
        return moment(v).format('YYYY-MM-DD');
    }
}