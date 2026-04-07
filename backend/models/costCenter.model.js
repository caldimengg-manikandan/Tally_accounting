module.exports = (sequelize, DataTypes) => {
  const CostCenter = sequelize.define('CostCenter', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    category: {
      type: DataTypes.STRING, // e.g., 'Project', 'Department', 'Employee'
      defaultValue: 'General'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  });

  return CostCenter;
};
