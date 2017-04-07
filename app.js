var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var jwt = require("jwt-simple");
var auth = require("./auth.js")();
var users = require("./users.js");
var cfg = require("./config.js");
var request = require('request');

var index = require('./routes/index');
// var users = require('./routes/users');

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
// app.use('/users', users);



app.get("/", function(req, res) {
    res.json({
        status: "My API is alive!"
    });
});

app.get("/user", auth.authenticate(), function(req, res) {
    res.json(users[0]);
    //res.json(users[req.user.id]);
});

app.post("/token", function(req, res) {
    var auth_status = false;
	request({
	  method: 'GET',
	  url: 'https://aitsgqueues.mrteera.com/messages/erp_response',
	  headers: {
		'Content-Type': 'application/json'
	  }
	}, function (error, auth_resp, resp_body) {
	  console.log('Status:', auth_resp.statusCode);
	  console.log('Headers:', JSON.stringify(auth_resp.headers));
	  console.log('Response:', resp_body);
      var auth_body = JSON.parse(JSON.parse(resp_body).message);
	  var gid = auth_body.gid;
      if (auth_body.auth == "ok") {
        auth_status = true;
		console.log(auth_status);
        var payload = {
          id: gid
        };
		var token = jwt.encode(payload, cfg.jwtSecret);
        res.json({
          token: token
        });
      } else {
        res.sendStatus(401);
      }
	});
});



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
