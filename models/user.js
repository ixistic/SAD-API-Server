'use strict';
module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define('User', {
    username: { type:DataTypes.STRING, allowNull: false },
    name: { type:DataTypes.STRING, allowNull: false },
    token: { type:DataTypes.STRING, allowNull: false },
  }, {
    classMethods: {
      associate: function(models) {
        User.belongsTo(models.Role, {
          as: "Role",
          onDelete: "CASCADE",
          foreignKey: {
            allowNull: false
          }
        });
        User.hasMany(models.Incident, {
          foreignKey: "created_by"
        });
        User.hasMany(models.Incident, {
          foreignKey: "updated_by"
        });
        User.hasMany(models.Incident, {
          foreignKey: "assignee_id"
        });
      }
    }
  });
  return User;
};
