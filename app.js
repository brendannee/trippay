var express = require('express');
var http = require('http');
var path = require('path');
var url = require('url');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
var nconf = require('nconf');
var session = require('express-session');

nconf
  .argv()
  .env()
  .file({file:'./config.json'});

var app = express();

if(app.get('env') !== 'development') {
	nconf.set('URL', 'http://trippay.co');
} else {
	nconf.set('URL', 'http://localhost:3000');
	app.use(require('connect-livereload')());
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
      }),
      cookie = {
        maxAge: 31536000000
      };
} else {
  var memoryStore = session.MemoryStore,
      store = new memoryStore(),
      cookie = {
        maxAge: 3600000,
      };
}


app.use(session({
  store: store,
  secret: nconf.get('SESSION_SECRET'),
  saveUninitialized: true,
  resave: true,
  cookie: cookie
}));


if(app.get('env') !== 'development') {
  //app.all('*', routes.force_https);
} else {
  app.all('*', routes.check_dev_token);
}

app.get('/', routes.index);

app.get('/authorize-automatic/', oauth.authorizeAutomatic);
app.get('/redirect-automatic/', oauth.redirectAutomatic);

app.get('/authorize-venmo/', oauth.authorizeVenmo);
app.get('/redirect-venmo/', oauth.redirectVenmo);

app.get('/logout/', oauth.logout);

app.get('/api/settings', routes.authenticate, api.getSettings);
app.put('/api/settings', routes.authenticate, api.updateSettings);

app.get('/api/trips/', routes.authenticate, api.getTrips);
app.get('/api/friends/', routes.authenticate, api.getFriends);
app.get('/api/me/', routes.authenticate, api.getMe);

app.get('/api/expenses/', routes.authenticate, api.getExpenses);
app.post('/api/expenses/', routes.authenticate, api.createExpense);

// error handlers
require('./libs/errors')(app);


module.exports = app;
