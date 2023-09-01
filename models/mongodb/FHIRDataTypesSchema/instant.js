const moment = require("moment");
module.exports = {
    type: Date,
    get: function (v) {
        if (v) return moment(v).format("YYYY-MM-DDTHH:mm:ss.SSSZ");
    },
    default: void 0
};
