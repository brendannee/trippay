var nconf = require('nconf'),
    request = require('request'),
    db = require('../libs/database'),
    venmoApiUrl = 'https://api.venmo.com',
    bmwApiUrl = 'http://data.api.hackthedrive.com';


exports.createExpense = function(req, res, next) {
  db.createExpense({
    user_id: req.session.user_id,
    expense_id: 'id'
  }, function(e) {
    if(e) return next(e);
    res.json(data);
  });
};


exports.getExpenses = function(req, res, next) {
  db.getExpenses(req.session.user_id, function(e, expenses) {
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
      return next(new Error('Not able to get friends'));
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
      return next(new Error('Unable to get BMW Trips'))
    }
  });
};
