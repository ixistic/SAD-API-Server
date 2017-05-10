// auth.js
var passport = require("passport");
var passportJWT = require("passport-jwt");
var cfg = require("../authentication/config.js");
var ExtractJwt = passportJWT.ExtractJwt;
var Strategy = passportJWT.Strategy;
var models = require('../models');
var params = {
    secretOrKey: cfg.jwtSecret,
    jwtFromRequest: ExtractJwt.fromAuthHeader()
};

module.exports = function() {
    var strategy = new Strategy(params, function(payload, done) {
      console.log(payload);
      models.User.findOne({ where: {username: payload.username} }).then(function(user) {
        if(user){
          return done(null, user);
        } else {
          return done(new Error("User not found"), null);
        }
      })
    });
    passport.use(strategy);
    return {
        initialize: function() {
            return passport.initialize();
        },
        authenticate: function() {
            return passport.authenticate("jwt", cfg.jwtSession);
        }
    };
};
