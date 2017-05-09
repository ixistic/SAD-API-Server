var models = require('../models');
var express = require('express');
var router = express.Router();
var auth = require("../authentication/auth.js")();
var http = require('http');
var s3 = require('s3');
const fileUpload = require('express-fileupload');

var client = s3.createClient({
  maxAsyncS3: 20,     // this is the default
  s3RetryCount: 3,    // this is the default
  s3RetryDelay: 1000, // this is the default
  multipartUploadThreshold: 20971520, // this is the default (20 MB)
  multipartUploadSize: 15728640, // this is the default (15 MB)
  s3Options: {
    accessKeyId: process.env.S3KEY,
    secretAccessKey: process.env.S3SECRET,
    region: 'ap-southeast-1'
  },
});

function makeid()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 10; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

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

router.post("/incidents", auth.authenticate(), function (req, res, next) {
 var title = req.body.title;
 var detail = req.body.detail;
 var latitude = req.body.latitude;
 var longitude = req.body.longitude;
 var image_url = null;
 let image_name = makeid();
 if (req.files) {
   let image = req.files.image;
   let image_type = req.files.image.mimetype;
   image.mv('/Users/ixistic/Desktop/SAD-API-Server/uploads/image', function(err) {
    if (err)
      return res.status(500).send(err);
    console.log('File uploaded!');
   });
   var params = {
     localFile: "/Users/ixistic/Desktop/SAD-API-Server/uploads/image",

     s3Params: {
       Bucket: "sad.ait.sg",
       Key: "uploads/"+image_name,
       ContentType: image_type,
       ACL: 'public-read'
       // other options supported by putObject, except Body and ContentLength.
       // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property
     },
   };
   var uploader = client.uploadFile(params);
   uploader.on('error', function(err) {
     console.error("unable to upload:", err.stack);
   });
   uploader.on('progress', function() {
     console.log("progress", uploader.progressMd5Amount,
               uploader.progressAmount, uploader.progressTotal);
   });
   uploader.on('end', function() {
     console.log("done uploading");
   });

   image_url = "https://s3-ap-southeast-1.amazonaws.com/sad.ait.sg/uploads/"+image_name;
 }
  models.Incident
    .create({title: title, detail: detail, latitude: latitude, longitude: longitude, status: "open", created_by: req.user.id, updated_by: req.user.id, image_url: image_url})
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