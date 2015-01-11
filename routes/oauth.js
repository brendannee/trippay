var nconf = require('nconf'),
    request = require('request'),
    bmwApiUrl = 'http://data.api.hackthedrive.com';


var oauth2Bmw = require('simple-oauth2')({
  clientID: nconf.get('BMW_CLIENT_ID'),
  clientSecret: nconf.get('BMW_CLIENT_SECRET'),
  site: 'http://data.api.hackthedrive.com',
  authorizationPath: '/oauth2/authorize'
});


var bmwAuthorizationUri = oauth2Bmw.authCode.authorizeURL({
  redirect_uri: nconf.get('URL') + '/redirect-bmw/'
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


exports.authorizeBmw = function(req, res, next) {
  res.redirect(bmwAuthorizationUri.replace('code', 'token'));
};


exports.redirectBmw = function (req, res, next) {
  res.render('index', {bmw: true});
};


exports.saveBmw = function(req, res, next) {
  if(req.body.token) {
    req.session.bmw_access_token = req.body.token;
    console.log(req.session.bmw_access_token);

    // get user id
    request.get({
      uri: bmwApiUrl + '/v1/Users',
      qs: {limit: 1},
      headers: {MojioAPIToken: req.session.bmw_access_token},
      json: true
    }, function(e, r, body) {
      if(e) return next(e);

      if(body && body.Data && body.Data.length) {
        req.session.bmw_user_id = body.Data[0]._id;
        console.log(req.session.bmw_user_id);
        res.json({});
      } else {
        return next(new Error('Unable to get BMW User Id'))
      }
    });
  } else {
    return next(new Error('No Access Token'));
  }
}


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
