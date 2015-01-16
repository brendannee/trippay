function showLoading() {
  $('.loading').fadeIn('fast');
}


function hideLoading() {
  $('.loading').fadeOut('fast');
}


function showAlert(msg, type) {
  var type = type || 'info';
  $('#alert').html(msg).removeClass().addClass('alert alert-' + type).slideDown();
}


function hideAlert() {
  $('#alert').slideUp();
}


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


function calculateTripCost(trip) {
  if(!trip.distance) {
    return 0;
  } else if(!settings.rate) {
    return 0;
  } else {
    return trip.distance * settings.rate;
  }
}


function formatCost(cost) {
  return '$' + (cost || 0).toFixed(2);
}


function formatNote(trip) {
  return 'Splitting trip to ' + formatAddress(trip.start_address) + ', ' + formatCityState(trip.start_address) + ' on ' + formatDateTime(trip.started_at);
}


function m_to_mi(distance_m) {
  return distance_m / 1609.34;
}
