module.exports = (sequelize, DataTypes) => {
  const RecurringExpense = sequelize.define('RecurringExpense', {
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
    profileName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    frequency: {
      type: DataTypes.ENUM('Daily', 'Weekly', 'Monthly', 'Yearly'),
      allowNull: false,
      defaultValue: 'Monthly'
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE
    },
    lastGeneratedDate: {
      type: DataTypes.DATE
    },
    nextGenerationDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'INR'
    },
    notes: {
      type: DataTypes.TEXT
    },
    status: {
      type: DataTypes.ENUM('Active', 'Expired', 'Paused'),
      defaultValue: 'Active'
    },
    expenseAccountId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    paidThroughId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    vendorId: {
      type: DataTypes.UUID
    },
    customerId: {
      type: DataTypes.UUID
    },
    CompanyId: {
      type: DataTypes.UUID,
      allowNull: false
    }
  });

  return RecurringExpense;
};
