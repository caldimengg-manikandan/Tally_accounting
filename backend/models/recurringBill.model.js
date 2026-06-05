module.exports = (sequelize, DataTypes) => {
  const RecurringBill = sequelize.define('RecurringBill', {
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
    repeatEvery: {
      type: DataTypes.STRING,
      allowNull: false
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE
    },
    neverExpires: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastGeneratedDate: {
      type: DataTypes.DATE
    },
    nextGenerationDate: {
      type: DataTypes.DATE
    },
    totalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
    },
    discount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    tdsRate: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    tdsName: {
      type: DataTypes.STRING
    },
    adjustment: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    notes: {
      type: DataTypes.TEXT
    },
    status: {
      type: DataTypes.ENUM('Active', 'Expired', 'Paused'),
      defaultValue: 'Active'
    },
    vendorId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    CompanyId: {
      type: DataTypes.UUID,
      allowNull: false
    }
  });

  return RecurringBill;
};
