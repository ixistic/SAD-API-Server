var models = require('../models');
var express = require('express');
var router = express.Router();
var auth = require("../authentication/auth.js")();

router.get("/guards", auth.authenticate(), function (req, res) {
  models.Role.findOne({
    where: {name: "Employee"}
  }).then(function(role) {
    models.User.findAll({
      where: {RoleId: role.id}
    }).then(function(users) {
      res.json(users);
    })
  })
});

module.exports = router;
