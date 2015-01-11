var nconf = require('nconf'),
    _ = require('underscore'),
    request = require('request'),
    async = require('async'),
    db = require('../libs/database'),
    venmoApiUrl = 'https://api.venmo.com',
    bmwApiUrl = 'http://data.api.hackthedrive.com';


exports.createExpense = function(req, res, next) {
  var tripId = req.body.tripId,
      note = req.body.note,
      friends = JSON.parse(req.body.friends || '[]'),
      costPerPerson = req.body.costPerPerson;

  async.map(friends, function(friend, cb) {
    var expense = {
      amount: costPerPerson,
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
      user_id: req.session.bmw_user_id,
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
  db.getExpenses(req.session.bmw_user_id, function(e, expenses) {
    if(e) return next(e);
    res.json(expenses);
  });
};


exports.getFriends = function(req, res, next) {
  request.get({
    uri: venmoApiUrl + '/v1/users/' + req.session.venmo_user_id + '/friends',
    qs: {access_token: req.session.venmo_access_token},
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
  request.get({
    uri: bmwApiUrl + '/v1/Trips',
    qs: {limit: 100, desc: true},
    headers: {MojioAPIToken: req.session.bmw_access_token},
    json: true,
    timeout: 10000
  }, function(e, r, body) {
    if(e) return next(e);
    if(body && body.Data) {
      res.json(body.Data);
    } else {
      return next(new Error('Unable to get BMW Trips'));
    }
  });
};
