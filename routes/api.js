var nconf = require('nconf'),
    request = require('request'),
    db = require('../libs/database');


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


exports.trips = function(req, res, next) {
  res.json('trips');
};
