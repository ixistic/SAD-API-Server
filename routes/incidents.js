var models = require('../models');
var express = require('express');
var router = express.Router();
var auth = require("../authentication/auth.js")();

router.get("/incidents", auth.authenticate(), function (req, res) {
  models.Incident.findAll({
    include: [
      { model: models.User , as: 'createdBy'},
      { model: models.User , as: 'updatedBy'},
      { model: models.User , as: 'assignee'}
    ]
  }).then(function(incidents) {
    res.json(incidents);
  })
});

router.get("/incidents/:id", auth.authenticate(), function (req, res) {
  var id = req.params.id;
  models.Incident.findOne({
    where: {id: id},
    include: [
      { model: models.User , as: 'createdBy'},
      { model: models.User , as: 'updatedBy'},
      { model: models.User , as: 'assignee'}
    ]
  }).then(function(incident) {
    res.json(incident);
  })
});

router.put("/incidents/:id", auth.authenticate(), function (req, res) {
  var id = req.params.id;
  var user_id = req.user.id;
  var status = req.body.status;
  var assignee_id = req.body.assignee;
  models.Incident.findOne({
    where: {id: id}
  }).then(function(incident) {
    if (incident) {
      incident.update(req.body);
      incident.updateAttributes({
        updated_by: user_id
      })
      res.json(incident);
    }
  })
});

router.post("/incidents", auth.authenticate(), function (req, res) {
 var title = req.body.title;
 var detail = req.body.detail;
 var latitude = req.body.latitude;
 var longitude = req.body.longitude;

 // console.log(req.user.id);
  models.Incident
    .create({title: title, detail: detail, latitude: latitude, longitude: longitude, status: "open", created_by: req.user.id, updated_by: req.user.id})
    .then(function() {
      models.Incident
        .findOrCreate({where: {title: title}, defaults: {title: title}})
        .spread(function(incident, created) {
          console.log(incident.get({
            plain: true
          }))
          console.log(created);
          res.json(incident);
      })
    })
});

module.exports = router;
