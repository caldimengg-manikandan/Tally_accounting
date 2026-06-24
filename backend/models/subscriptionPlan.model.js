module.exports = (sequelize, DataTypes) => {
  const SubscriptionPlan = sequelize.define('SubscriptionPlan', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false, // e.g., 'Basic', 'Pro', 'Enterprise'
      unique: true
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    maxUsers: {
      type: DataTypes.INTEGER,
      allowNull: true // null means unlimited
    },
    features: {
      type: DataTypes.JSON,
      defaultValue: [] // e.g., ['INVENTORY', 'MULTI_CURRENCY', 'COST_CENTERS']
    }
  });

  return SubscriptionPlan;
};
