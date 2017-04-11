var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var models = require('./models');
var auth = require("./authentication/auth.js")();
var users = require("./authentication/users.js");
var cfg = require("./authentication/config.js");
var request = require('request');
var jwt = require("jwt-simple");

var index = require('./routes/index');
var users = require('./routes/users');

function pollingAuth() {
  request({
    method: 'GET',
    url: 'https://aitsgqueues.mrteera.com/messages/erp_response',
    headers: {
      'Content-Type': 'application/json'
    }
  }, function (error, auth_resp, resp_body) {
    if(JSON.parse(resp_body).message){
      console.log('Status:', auth_resp.statusCode);
      console.log('Headers:', JSON.stringify(auth_resp.headers));
      console.log('Response:', resp_body);
      var auth_body = JSON.parse(JSON.parse(resp_body).message);
      var gid = auth_body.gid;
      var g_name = auth_body.name;
      if (auth_body.auth == "ok") {
        var payload = {
          gid: gid
        };
        var token = jwt.encode(payload, cfg.jwtSecret);
        models.Guard
          .findOrCreate({where: {token: token}, defaults: {gid: gid, name: g_name, token: token}})
          .spread(function(guard, created) {
            console.log(guard.get({
              plain: true
            }));
            console.log("ok 200 send token");
            //TODO FCM send message (success with token)
            //TODO delete queue message
          })
      } else {
        //TODO FCM send message (fail)
        //TODO delete queue message
        console.log("fail 401");
      }
    }
  });
}
setInterval(pollingAuth, 3000);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(auth.initialize());

app.use('/', index);
app.use('/', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
