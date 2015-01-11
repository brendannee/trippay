function showLoading() {
  $('.loading').fadeIn('fast');
}


function hideLoading() {
  $('.loading').fadeOut('fast');
}


function showAlert(msg, type) {
  var type = type || 'info';
  $('#alert').html(msg).removeClass().addClass('alert alert-' + type).fadeIn();
}


function hideAlert() {
  $('#alert').fadeOut();
}


function formatAddress(address) {
  if(address) {
    return address.Address1;
  } else {
    return 'Unknown';
  }
}


function formatCityState(address) {
  if(address) {
    return address.City + ', ' + address.State;
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
    return '';
  } else if(!mileageRate) {
    return '';
  } else {
    return trip.distance * mileageRate;
  }
}


function formatCost(cost) {
  return '$' + (cost || 0).toFixed(2);
}
