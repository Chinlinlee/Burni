const moment = require('moment');
module.exports = {
    type: Number,
    default: void 0,
    set: function(v) {
        let timeDate = moment(v, "hh:mm:ss.SSS").toDate();
        let storeTime = timeDate.getHours() * 3600000 + timeDate.getMinutes() * 60000+ timeDate.getSeconds() * 1000 + timeDate.getMilliseconds();
        console.log(storeTime);
        return storeTime;
    },
    get: function(v) {
        let hours = parseInt(v / 3600000);
        let leaves = v - hours * 3600000;
        let minutes = parseInt(leaves / 60000);
        let leavesSeconds = (leaves - minutes * 60000);
        let seconds = parseInt(leavesSeconds / 1000);
        let milliSeconde = leavesSeconds - seconds * 1000;
        if (milliSeconde > 0 ) {
            return `${hours.toString().padStart(2,"00")}:${minutes.toString().padStart(2,"00")}:${seconds.toString().padStart(2,"00")}.${milliSeconde.toString().padStart(3,"000")}`;
        }
        return `${hours.toString().padStart(2,"00")}:${minutes.toString().padStart(2,"00")}:${seconds.toString().padStart(2,"00")}`;
    }
}