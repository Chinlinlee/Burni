const moment = require('moment');
module.exports = {
    type: Date,
    default: void 0,
    get: function(v) {
        if (v) return moment(v).format('YYYY-MM-DDTHH:mm:ssZ');
    }
};