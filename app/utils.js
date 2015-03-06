//utils.js


// This isn't working Yet!!!!!!!!
Date.prototype.getMonthName = function() {
	var monthNames = [ "January", "February", "March", "April", "May", "June", 
            "July", "August", "September", "October", "November", "December" ];
    return monthNames[this.getMonth()];
}

function parseDate(input) {
  'use strict';
  var parts = input.split(/[\/ .:]/);
  // new Date(year, month [, day [, hours[, minutes[, seconds[, ms]]]]])
  return new Date(parts[0], parts[1]-1, parts[2],parts[3],parts[4],parts[5]); // Note: months are 0-based
}


exports.pareDate = parseDate;
