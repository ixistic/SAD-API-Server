'use strict';
module.exports = function(sequelize, DataTypes) {
  var Incident = sequelize.define('Incident', {
    title: DataTypes.STRING,
    latitude: DataTypes.FLOAT,
    longitude: DataTypes.FLOAT,
    image_url: DataTypes.STRING,
    detail: DataTypes.STRING,
    status: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        Incident.belongsTo( models.User, {
          as: 'createdBy',
          foreignKey: {
            name: 'created_by',
            allowNull: false
          }
        });
        Incident.belongsTo( models.User, {
          as: 'updatedBy',
          foreignKey: {
            name: 'updated_by',
            allowNull: false
          }
        });
        Incident.belongsTo( models.User, {
          as: 'assignee',
          foreignKey: {
            name: 'assignee_id',
            allowNull: true
          }
        });
      }
    }
  });
  return Incident;
};
