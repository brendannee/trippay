var _ = require('underscore'),
    $ = require('jquery'),
    helper = require('./helper');

exports.fetchExpenses = function(cb) {
  $.get('/api/expenses/')
  .done(function(results) {
    cb(results);
  });
};


exports.fetchTrips = function(page, cb) {
  $.get('/api/trips/', { page: page }).done(function(data) {
    cb(data.map(helper.formatTrip));
  });
};


exports.fetchFriends = function(cb) {
  $.get('/api/friends/').done(cb);
};


exports.fetchMe = function(cb) {
  $.get('/api/me/').done(cb);
};


exports.createExpense = function(trip, friends, costPerPerson, cb) {
  $.post('/api/expenses/', {
    tripId: trip.id,
    friends: JSON.stringify(friends),
    costPerPerson: costPerPerson,
    note: helper.formatNote(trip)
  }, cb);
};


exports.fetchSettings = function(cb) {
  $.get('/api/settings/', cb);
};


exports.updateSettings = function(settings, cb) {
  $.ajax({
    url: '/api/settings/',
    type: 'PUT',
    data: settings
  })
  .done(cb);
};
