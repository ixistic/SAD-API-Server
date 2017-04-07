var express = require('express');
var router = express.Router();
var auth = require("../authentication/auth.js")();
var users = require("../authentication/users.js");
var cfg = require("../authentication/config.js");
var jwt = require("jwt-simple");
var request = require('request');

var pgp = require('pg-promise')(/*options*/)
var db_user = process.env.aitsg_db_username;
var db_password = process.env.aitsg_db_password;
var db = pgp('postgres://' + db_user + ':' + db_password + '@localhost:5432/aitsg')

router.get("/user", auth.authenticate(), function(req, res) {
    res.json(users[0]);
    //res.json(users[req.user.id]);
});

router.post("/token", function(req, res) {
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
      var g_name = auth_body.name;
    if (auth_body.auth == "ok") {
      auth_status = true;
	    console.log(auth_status);
      var payload = {
        gid: gid
      };
	  var token = jwt.encode(payload, cfg.jwtSecret);
      var doc = {
        gid: gid,
        name: g_name,
        token: token
      };

      db.query('SELECT count(*) from guards where gid = $1', gid)
        .then(result => {
          var count = result[0]['count'];
          if (count < 1) {
            db.query('INSERT INTO guards(gid, name, token) VALUES(${gid}, ${name}, ${token})', doc)
              .then(() => {
                // TODO change to firebase
                res.json({
                  token: token
                });
            })
              .catch(error => {
              console.log(error);
            });
          } else {
            db.query('SELECT token from guards where gid = $1', gid)
              .then(result => {
                var token = result[0]['token'];
                // TODO change to firebase
                res.json({
                  token: token
                });
              });
          }
        });
    } else {
      res.sendStatus(401);
    }
	});
});

module.exports = router;
