function fetchExpenses(cb) {
  showLoading();
  $.getJSON('/api/expenses/')
  .done(function(results) {
    expenses = results;
    cb();
  });
}


function fetchTrips(cb) {
  $.getJSON('/api/trips/').done(cb);
}


function fetchFriends(cb) {
  $.getJSON('/api/friends/').done(cb);
}


function createExpense(trip, cb) {
  $.post('/api/expenses/', trip, cb);
}
