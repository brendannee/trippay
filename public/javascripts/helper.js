var $ = require('jquery'),
    _ = require('underscore'),
    moment = require('moment-timezone');

exports.showAlert = function(msg, type) {
  $('#alert').html(msg).removeClass().addClass('alert alert-' + (type || 'info')).slideDown();
};


exports.hideAlert = function() {
  $('#alert').slideUp();
};


exports.formatNote = function(trip) {
  return 'Splitting trip to ' + formatAddress(trip.start_address) + ', ' + formatCityState(trip.start_address) + ' on ' + formatDateTime(trip.started_at);
};


exports.formatCost = function(cost) {
  return '$' + (cost || 0).toFixed(2);
};


exports.calculateTripCost = function(trip, settings) {
  if(!trip.distance) {
    return 0;
  } else if(!settings.rate) {
    return 0;
  } else {
    return trip.distance * settings.rate;
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
