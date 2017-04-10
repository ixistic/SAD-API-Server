var models = require('../models');
var express = require('express');
var router = express.Router();
var auth = require("../authentication/auth.js")();
var users = require("../authentication/users.js");
var cfg = require("../authentication/config.js");
var jwt = require("jwt-simple");
var request = require('request');

router.get("/user", auth.authenticate(), function (req, res) {
  res.json(users[0]);
  //res.json(users[req.user.id]);
});

router.post("/token", function (req, res) {
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

      models.Guard
        .findOrCreate({where: {token: token}, defaults: {gid: gid, name: g_name, token: token}})
        .spread(function(guard, created) {
          console.log(guard.get({
            plain: true
          }));
          console.log(created);
          res.json({
            token: token
          })
        })
    } else {
      res.sendStatus(401);
    }
  });
});

module.exports = router;
