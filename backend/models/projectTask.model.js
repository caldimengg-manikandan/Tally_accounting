module.exports = (sequelize, DataTypes) => {
  const ProjectTask = sequelize.define('ProjectTask', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    CreatedBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    ModifiedBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    billingRate: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    isBillable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    status: {
      type: DataTypes.ENUM('Active', 'Completed'),
      defaultValue: 'Active'
    }
  });

  return ProjectTask;
};
