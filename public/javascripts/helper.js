var $ = require('jquery'),
    _ = require('underscore'),
    moment = require('moment-timezone');
    

exports.formatNote = function(trip) {
  return 'Splitting trip to ' + formatAddress(trip.start_address) + ', ' + formatCityState(trip.start_address) + ' on ' + formatDateTime(trip.started_at);
};


exports.formatCost = function(cost) {
  return '$' + (cost || 0).toFixed(2);
};


exports.calculateTripCost = function(trip, rate) {
  if(!trip.distance) {
    return 0;
  } else if(!rate) {
    return 0;
  } else {
    return trip.distance * rate;
  }
};


exports.formatTrip = function(trip, idx, trips) {
  return _.extend(trip, {
    startAddressFormatted: formatAddress(trip.start_address),
    startAddressCityState: formatCityState(trip.start_address),
    endAddressFormatted: formatAddress(trip.end_address),
    endAddressCityState: formatCityState(trip.end_address),
    startDate: formatDate(trip.started_at),
    startTimeFormatted: formatTime(trip.started_at),
    startDateTime: formatDateTime(trip.started_at),
    endDateTime: formatDateTime(trip.ended_at),
    distance: m_to_mi(trip.distance_m),
    nextTrip: (idx > 0) ? trips[idx - 1].id : null,
    prevTrip: (idx < (trips.length -1)) ? trips[idx + 1].id : null
  });
};


exports.substringMatcher = function(strs) {
  //for Typeahead
  return function findMatches(q, cb) {
    // an array that will be populated with substring matches
    var matches = [];

    // regex used to determine if a string contains the substring `q`
    var substrRegex = new RegExp(q, 'i');

    // iterate through the pool of strings and for any string that
    // contains the substring `q`, add it to the `matches` array
    $.each(strs, function(i, str) {
      if (substrRegex.test(str)) {
        // the typeahead jQuery plugin expects suggestions to a
        // JavaScript object, refer to typeahead docs for more info
        matches.push({ value: str });
      }
    });

    cb(matches);
  };
};


function formatAddress(address) {
  if(address) {
    return address.street_number + ' ' + address.street_name;
  } else {
    return 'Unknown';
  }
}


function formatCityState(address) {
  if(address) {
    return address.city + ', ' + address.state;
  } else {
    return '';
  }
}


function formatDate(time) {
  if(time) {
    return moment(time).format('MMM Do, YYYY');
  } else {
    return '';
  }
}


function formatTime(time) {
  if(time) {
    return moment(time).format('h:mma');
  } else {
    return '';
  }
}

function formatDateTime(time) {
  return formatTime(time) + ' ' + formatDate(time);
}


function m_to_mi(distance_m) {
  return distance_m / 1609.34;
}
