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


function createExpense(trip, cb) {
  $.post('/api/expenses/', trip, cb);
}


function formatTrip(trip, idx, trips) {
  return _.extend(trip, {
    StartAddressAddress: formatAddress(trip.StartAddress),
    StartAddressCityState: formatCityState(trip.StartAddress),
    EndAddressAddress: formatAddress(trip.EndAddress),
    EndAddressCityState: formatCityState(trip.EndAddress),
    StartDate: formatDate(trip.StartTime),
    StartTimeFormatted: formatTime(trip.StartTime),
    StartDateTime: formatDateTime(trip.StartTime),
    EndDateTime: formatDateTime(trip.EndTime),
    NextTrip: (idx > 0) ? trips[idx - 1]._id : null,
    PrevTrip: (idx < (trips.length -1)) ? trips[idx + 1]._id : null
  });
}
