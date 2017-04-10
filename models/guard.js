'use strict';
module.exports = function(sequelize, DataTypes) {
  var Guard = sequelize.define('Guard', {
    gid: { type:DataTypes.STRING, allowNull: false },
    name: { type:DataTypes.STRING, allowNull: false },
    token: { type:DataTypes.STRING, allowNull: false },
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return Guard;
};
