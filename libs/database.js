var monk = require('monk');
var db = monk(process.env.MONGOLAB_URI || 'mongodb://127.0.0.1:27017/trippay');
var expenses = db.get('expenses');
var settings = db.get('settings');


exports.getExpenses = function(user_id, cb) {
  expenses.find({user_id: user_id}, {sort: {_id: 1}}, cb);
};


exports.createExpense = function(expense, cb) {
  expenses.insert(expense, cb);
};


exports.getSettings = function(automatic_id, cb) {
  settings.findOne({automatic_id: automatic_id}, cb);
};


exports.updateSettings = function(automatic_id, data, cb) {
  settings.update(
    {automatic_id: automatic_id},
    {$set: data},
    {upsert: true},
    cb
  );
};
