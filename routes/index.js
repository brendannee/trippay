exports.index = function(req, res, next) {
  if(req.session && req.session.access_token) {
    res.render('trips', {loggedIn: true});
  } else {
    res.render('index');
  }
};


exports.authenticate = function(req, res, next) {
  if(!req.session || !req.session.access_token) {
    if(req.xhr) {
      var error = new Error('Not logged in')
      error.status = 401;
      return next(error);
    } else {
      return res.redirect('/');
    }
  } else {
    next();
  }
};


exports.force_https = function(req, res, next) {
  if(req.headers['x-forwarded-proto'] != 'https') {
    res.redirect('https://' + req.headers.host + req.path);
  } else {
    next();
  }
};


exports.check_dev_token = function(req, res, next) {
  // Allows local dev environent to specify access token
  if(process.env.TOKEN) {
    req.session.access_token = process.env.TOKEN;
  }
  if(process.env.USER_ID) {
    req.session.user_id = process.env.USER_ID;
  }
  next();
};
