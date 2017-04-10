'use strict';
module.exports = function(sequelize, DataTypes) {
  var Guard = sequelize.define('Guard', {
    gid: { type:Sequelize.STRING, allowNull: false },
    name: { type:Sequelize.STRING, allowNull: false },
    token: { type:Sequelize.STRING, allowNull: false },
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return Guard;
};
