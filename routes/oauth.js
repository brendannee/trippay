var nconf = require('nconf'),
    request = require('request');


var oauth2Automatic = require('simple-oauth2')({
  clientID: nconf.get('AUTOMATIC_CLIENT_ID'),
  clientSecret: nconf.get('AUTOMATIC_CLIENT_SECRET'),
  site: 'https://accounts.automatic.com',
  tokenPath: '/oauth/access_token'
});


var automaticAuthorizationUri = oauth2Automatic.authCode.authorizeURL({
  scope: 'scope:user:profile scope:trip scope:location scope:vehicle:profile scope:vehicle:events scope:behavior'
});


var oauth2Venmo = require('simple-oauth2')({
  clientID: nconf.get('VENMO_CLIENT_ID'),
  clientSecret: nconf.get('VENMO_CLIENT_SECRET'),
  site: 'https://api.venmo.com/v1',
  tokenPath: '/oauth/access_token'
});


var venmoAuthorizationUri = oauth2Venmo.authCode.authorizeURL({
  scope: 'make_payments access_friends'
});


exports.authorizeAutomatic = function(req, res, next) {
  res.redirect(automaticAuthorizationUri);
};


exports.redirectAutomatic = function (req, res, next) {
  var code = req.query.code;

  oauth2Automatic.authCode.getToken({
    code: code
  }, function(e, result) {
    if(e) return next(e);

    // Attach `token` to the user's session for later use
    var token = oauth2Automatic.accessToken.create(result);

    req.session.automatic_access_token = token.token.access_token;
    req.session.automatic_user_id = token.token.user.id;
    res.redirect('/');
  });
};


exports.authorizeVenmo = function(req, res, next) {
  res.redirect(venmoAuthorizationUri);
};


exports.redirectVenmo = function (req, res, next) {
  var code = req.query.code;

  oauth2Venmo.authCode.getToken({
    code: code
  }, function(e, result) {
    if(e) return next(e);

    // Attach `token` to the user's session for later use
    var token = oauth2Venmo.accessToken.create(result);

    req.session.venmo_access_token = token.token.access_token;
    req.session.venmo_user_id = token.token.user.id;
    console.log(req.session.venmo_access_token);
    console.log(req.session.venmo_user_id);

    res.redirect('/');
  });
};


exports.logout = function(req, res, next) {
  req.session.destroy();
  res.redirect('/');
};
