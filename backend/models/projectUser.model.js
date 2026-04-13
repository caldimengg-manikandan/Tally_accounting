module.exports = (sequelize, DataTypes) => {
  const ProjectUser = sequelize.define('ProjectUser', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    billingRate: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    role: {
      type: DataTypes.STRING, // e.g., 'Admin', 'Standard User'
      defaultValue: 'Standard User'
    }
  });

  return ProjectUser;
};
