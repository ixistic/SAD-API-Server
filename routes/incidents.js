var models = require('../models');
var express = require('express');
var router = express.Router();
var auth = require("../authentication/auth.js")();
var http = require('http');
var s3 = require('s3');
var FCM = require('fcm-node');
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
  var status = req.query.status;
  var assignee_id = req.query.assignee_id;
  if(status) {
    models.Incident.findAll({
      where: {status: status},
      include: [
        { model: models.User , as: 'createdBy'},
        { model: models.User , as: 'updatedBy'},
        { model: models.User , as: 'assignee'}
      ]
    }).then(function(incidents) {
      res.json(incidents);
    })
  } else if(assignee_id) {
    models.Incident.findAll({
      where: {assignee_id: assignee_id},
      include: [
        { model: models.User , as: 'createdBy'},
        { model: models.User , as: 'updatedBy'},
        { model: models.User , as: 'assignee'}
      ]
    }).then(function(incidents) {
      res.json(incidents);
    })
  } else {
    models.Incident.findAll({
      include: [
        { model: models.User , as: 'createdBy'},
        { model: models.User , as: 'updatedBy'},
        { model: models.User , as: 'assignee'}
      ]
    }).then(function(incidents) {
      res.json(incidents);
    })
  }
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
  var assignee_id = req.body.assignee_id;
  models.Incident.findOne({
    where: {id: id}
  }).then(function(incident) {
    if (incident) {
      incident.update(req.body).then(function(incident){
        console.log(status);
        if(status == "in progress"){
          models.Device.findAll({
            where: {UserId: assignee_id},
            attributes: ['token']
          }).then(function(device_tokens) {
            console.log(assignee_id);
            // console.log(JSON.stringify(device_tokens));
            for(index in device_tokens) {
              var token = device_tokens[index].token;
              var serverKey = 'AAAALDv0PMk:APA91bFz8ZKJVrqd6AVaaLJLPYU7UVaIhco4_DUzZft76tcttwf88SfVXEIhmZtS1MRW_WyppFU9I75mh9qsz1R7ARGPivFB3d7NJzOzcP9Qt8LHikDVz6tYVB42VqO-INJRfZLgnfS4'; //put your server key here
              var fcm = new FCM(serverKey);

              var message = {
                  to: token,

                  data: {
                      incident: incident
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
          })
        }
      });
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
   console.log('Has file');
   let image = req.files.image;
   let image_type = req.files.image.mimetype;
   image.mv(process.env.IMAGEPATH+'/uploads/image', function(err) {
    if (err){
      console.log('Cannot upload file');
      return res.status(500).send(err);
    }
    console.log('File uploaded!');
   });
   var params = {
     localFile: process.env.IMAGEPATH+"/uploads/image",

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
      .then(function(incident) {
        console.log(incident.get({
          plain: true
        }))
        res.json(incident);
    })
});

module.exports = router;
