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
  //todo - post message to queue
  res.json({
    message: "loggin in"
  });
});

module.exports = router;
