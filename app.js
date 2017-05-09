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
var FCM = require('fcm-node');

var index = require('./routes/index');
var users = require('./routes/users');
var incidents = require('./routes/incidents');
var guards = require('./routes/guards');

function deleteMessageFromERPResponseQueue(message_id) {
  request({
    method: 'DELETE',
    url: 'https://aitsgqueues.mrteera.com/messages/erp_response/' + message_id,
    headers: {
      'Content-Type': 'application/json'
    }
  }, function (error, auth_resp, resp_body) {
    console.log('Deleted message_id: ' + message_id);
  });
}

function sendFcmMessage(message,device_token,access_token) {
  var serverKey = 'AAAALDv0PMk:APA91bFz8ZKJVrqd6AVaaLJLPYU7UVaIhco4_DUzZft76tcttwf88SfVXEIhmZtS1MRW_WyppFU9I75mh9qsz1R7ARGPivFB3d7NJzOzcP9Qt8LHikDVz6tYVB42VqO-INJRfZLgnfS4'; //put your server key here
  var fcm = new FCM(serverKey);

  var message = {
      to: device_token,

      data: {
          access_token: access_token,
          status: message
      }
  };

  fcm.send(message, function(err, response){
      if (err) {
          console.log("Something has gone wrong!",err);
      } else {
          console.log("Successfully sent with response: ", response);
      }
  });
}

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
      var message_id = JSON.parse(resp_body).id;
      var auth_body = JSON.parse(JSON.parse(resp_body).message);
      var username = auth_body.gid;
      var name = auth_body.name;
      var role_name = auth_body.role;
      var device_token = auth_body.device_token;
      if (auth_body.auth == "true") {
        var payload = {
          username: username
        };
        var token = jwt.encode(payload, cfg.jwtSecret);
        models.Role
          .findOrCreate({where: {name: role_name}, defaults: {name: role_name}})
          .spread(function(role, created) {
            console.log(role.get({
              plain: true
            }));
            models.User
              .findOrCreate({where: {token: token}, defaults: {username: username, name: name, token: token, RoleId: role.id}})
              .spread(function(user, created) {
                console.log(user.get({
                  plain: true
                }));
                if(device_token)
                  sendFcmMessage("authenticated",device_token,token);
                deleteMessageFromERPResponseQueue(message_id);
                console.log("200 OK");
              })
          })
      } else {
        if(device_token)
          sendFcmMessage("unauthorized",device_token,"");
        deleteMessageFromERPResponseQueue(message_id);
        console.log("401 Unauthorized");
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
app.use('/', incidents);
app.use('/', guards);

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
