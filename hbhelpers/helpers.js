var moment = require('moment');


function formatDate(date) {
    // Get the UTC standard date version of this date
    m = moment.utc(date);
    // Format it for the current server timezone
    return m.parseZone().format('dddd, MMMM Do YYYY, h:mm a');
}

function length(array) {
    return array.length;
}

function checkHeight(q) {

    console.log('entered checkHeight');
    return q > 1 && q < 300;

}

module.exports = {
    formatDate : formatDate,
    length: length,
    checkHeight: checkHeight
}