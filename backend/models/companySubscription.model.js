module.exports = (sequelize, DataTypes) => {
  const CompanySubscription = sequelize.define('CompanySubscription', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    paymentStatus: {
      type: DataTypes.STRING, // e.g., 'Paid', 'Failed', 'Pending'
      defaultValue: 'Pending'
    },
    razorpaySubscriptionId: {
      type: DataTypes.STRING,
      allowNull: true
    }
  });

  return CompanySubscription;
};
