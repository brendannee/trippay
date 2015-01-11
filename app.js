var express = require('express');
var http = require('http');
var path = require('path');
var url = require('url');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
var nconf = require('nconf');
var session = require('express-session');

nconf.env().argv();
nconf.file('./config.json');

var app = express();

if(app.get('env') !== 'development') {
	nconf.set('URL', 'https://bmwhackathon.herokuapp.com');
} else {
	nconf.set('URL', 'http://localhost:3000');
}

var routes = require('./routes');
var api = require('./routes/api');
var oauth = require('./routes/oauth');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

if(app.get('env') !== 'development') {
  var RedisStore = require('connect-redis')(session),
      redisURL = url.parse(nconf.get('REDISCLOUD_URL')),
      store = new RedisStore({
        host: redisURL.hostname,
        port: redisURL.port,
        pass: redisURL.auth.split(':')[1]
      });
} else {
  var memoryStore = session.MemoryStore,
      store = new memoryStore();
}


app.use(session({
  store: store,
  secret: nconf.get('SESSION_SECRET'),
  saveUninitialized: true,
  resave: true
}));


if(app.get('env') !== 'development') {
  app.all('*', routes.force_https);
} else {
  app.all('*', routes.check_dev_token);
}

app.get('/', routes.index);

app.get('/api/trips/', routes.authenticate, api.trips);
app.get('/authorize-bmw/', oauth.authorizeBmw);
app.get('/redirect-bmw/', oauth.redirectBmw);
app.post('/redirect-bmw/', oauth.saveBmw);

app.get('/authorize-venmo/', oauth.authorizeVenmo);
app.get('/redirect-venmo/', oauth.redirectVenmo);

app.get('/logout/', oauth.logout);


app.get('/api/expenses/', routes.authenticate, api.getExpenses);
app.post('/api/expenses/', routes.authenticate, api.createExpense);


// error handlers

// catch 404 errors
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  res.status(404);
  if(req.xhr) {
    res.send({
      message: err.message,
      error: {}
    });
  } else {
    res.render('error', {
      message: err.message,
      description: 'Page not found',
      error: {}
    });
  }
});

// catch 401 Unauthorized errors
app.use(function(err, req, res, next) {
  if(err.status !== 401) return next();
  res.status(401);
  if(req.xhr) {
    res.send({
      message: err.message,
      error: err
    });
  } else {
    res.render('error', {
      message: err.message,
      description: 'You need to log in to see this page.',
      error: err
    });
  }
});


// log all other errors
app.use(function(err, req, res, next) {
  console.error(err.stack);
  next(err);
});

// development 500 error handler
// will print stacktrace
if(app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(500);
    if(req.xhr) {
      res.send({
        message: err.message,
        error: err
      });
    } else {
      res.render('error', {
        message: err.message,
        error: err
      });
    }
  });
}


// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(500);
  if(req.xhr) {
    res.send({
      message: err.message,
      error: {}
    });
  } else {
    res.render('error', {
      message: err.message,
      description: 'Server error',
      error: {}
    });
  }
});


module.exports = app;
