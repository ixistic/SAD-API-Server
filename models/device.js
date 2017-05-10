'use strict';
module.exports = function(sequelize, DataTypes) {
  var Device = sequelize.define('Device', {
    token: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        Device.belongsTo(models.User, {
          onDelete: "CASCADE",
          foreignKey: {
            allowNull: false
          }
        });
      }
    }
  });
  return Device;
};
