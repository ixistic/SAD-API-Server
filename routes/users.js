var models = require('../models');
var express = require('express');
var router = express.Router();
var auth = require("../authentication/auth.js")();
var users = require("../authentication/users.js");
var cfg = require("../authentication/config.js");
var jwt = require("jwt-simple");
var request = require('request');
var jsesc = require('jsesc');

router.get("/user", auth.authenticate(), function (req, res) {
  res.json(users[0]);
  //res.json(users[req.user.id]);
});

router.post("/token", function (req, res) {
  var req_message = jsesc(req.body);
  payload = {
    "qname": "erp_request",
    "message": req_message
  };
  request.post({
    url: 'https://aitsgqueues.mrteera.com/messages/erp_request',
    form: payload
  }, function(err,httpResponse,body){
    res.json({
      message: "logging in"
    });
  })
});

module.exports = router;
