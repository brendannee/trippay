var nconf = require('nconf'),
    _ = require('underscore'),
    request = require('request'),
    async = require('async'),
    db = require('../libs/database'),
    venmoApiUrl = 'https://api.venmo.com',
    automaticApiUrl = 'https://api.automatic.com';


exports.createExpense = function(req, res, next) {
  var tripId = req.body.tripId,
      note = req.body.note,
      friends = JSON.parse(req.body.friends || '[]'),
      costPerPerson = req.body.costPerPerson;

  async.map(friends, function(friend, cb) {
    var expense = {
      amount: costPerPerson * -1,
      note: note
    };

    if(friend.id) {
      expense.user_id = friend.id
    } else if(friend.display_name.indexOf('@') !== -1) {
      //send as email
      expense.email = friend.display_name;
    } else {
      //send as phone number
      expense.phone = friend.display_name;
    }

    postExpense(expense, cb);
  }, function(e, results) {
    if(e) return next(e)

    db.createExpense({
      user_id: req.session.automatic_id,
      trip_id: tripId,
      friends: friends,
      costPerPerson : costPerPerson
    }, function(e) {
      if(e) return next(e);
      res.json(results);
    });
  });


  function postExpense(expense, cb) {
    request.post({
      uri: venmoApiUrl + '/v1/payments',
      qs: _.extend(expense, {access_token: req.session.venmo_access_token}),
      json: true,
      timeout: 10000
    }, function(e, r, body) {
      cb(e, body);
    });
  }
};


exports.getExpenses = function(req, res, next) {
  db.getExpenses(req.session.automatic_id, function(e, expenses) {
    if(e) return next(e);
    res.json(expenses);
  });
};


exports.getFriends = function(req, res, next) {
  var limit = 10000;
  request.get({
    uri: venmoApiUrl + '/v1/users/' + req.session.venmo_user_id + '/friends',
    qs: {access_token: req.session.venmo_access_token, limit: limit},
    json: true,
    timeout: 10000
  }, function(e, r, body) {
    if(e) return next(e);
    if(body && body.data) {
      res.json(body.data);
    } else {
      return next(new Error('Unable to get friends'));
    }
  });
};


exports.getMe = function(req, res, next) {
  request.get({
    uri: venmoApiUrl + '/v1/users/' + req.session.venmo_user_id,
    qs: {access_token: req.session.venmo_access_token},
    json: true,
    timeout: 10000
  }, function(e, r, body) {
    if(e) return next(e);
    if(body && body.data) {
      res.json(body.data);
    } else {
      return next(new Error('Unable to get user profile'));
    }
  });
};


exports.getTrips = function(req, res, next) {
  async.parallel([
    function(cb) { downloadTrips(req, cb); },
    function(cb) { downloadVehicles(req, cb); }
  ], function(e, data) {
    if(e) return next(e);

    if(!data[0]) {
      res.json([]);
    } else {
      res.json(mergeTripsAndVehicles(data[0], data[1]));
    }
  });
};


exports.getSettings = function(req, res, next) {
  db.getSettings(req.session.automatic_user_id, function(e, settings) {
    if(e) return next(e);
    res.json(_.omit(settings, ['_id', 'automatic_id']));
  });
};


exports.updateSettings = function(req, res, next) {
  db.updateSettings(req.session.automatic_user_id, req.body, function(e) {
    if(e) return next(e);
    res.json({});
  });
};


function downloadTrips(req, cb) {
  request.get({
    uri: automaticApiUrl + '/trip/',
    headers: {Authorization: 'bearer ' + req.session.automatic_access_token},
    json: true,
    qs: {
      limit: 25,
      page: req.query.page
    }
  }, function(e, r, body) {
    cb(e, body.results);
  });
}


function downloadVehicles (req, cb) {
  request.get({
    uri: automaticApiUrl + '/vehicle/',
    headers: {Authorization: 'bearer ' + req.session.automatic_access_token},
    json: true
  }, function(e, r, body) {
    cb(e, body.results);
  });
}


function mergeTripsAndVehicles(trips, vehicles) {
  var vehicleObj = _.object(_.pluck(vehicles, 'url'), vehicles);

  return trips.map(function(trip) {
    trip.vehicle = vehicleObj[trip.vehicle];
    return trip;
  });
}
