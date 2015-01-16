function fetchExpenses(cb) {
  showLoading();
  $.getJSON('/api/expenses/')
  .done(function(results) {
    expenses = results;
    cb();
  });
}


function fetchTrips(cb) {
  $.getJSON('/api/trips/').done(function(data) {
    cb(data.map(formatTrip));
  });
}


function fetchFriends(cb) {
  $.getJSON('/api/friends/').done(cb);
}


function fetchMe(cb) {
  $.getJSON('/api/me/').done(cb);
}


function createExpense(trip, friends, costPerPerson, cb) {
  $.post('/api/expenses/', {
    tripId: trip.id,
    friends: JSON.stringify(friends),
    costPerPerson: costPerPerson,
    note: formatNote(trip)
  }, cb);
}


function fetchSettings(cb) {
  $.getJSON('/api/settings/', cb);
}


function updateSettings(settings, cb) {
  $.ajax({
    url: '/api/settings/',
    type: 'PUT',
    data: settings
  })
  .done(cb);
}


function formatTrip(trip, idx, trips) {
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
}
