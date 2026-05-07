module.exports = (sequelize, DataTypes) => {
  const Timesheet = sequelize.define('Timesheet', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    hours: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isBillable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    status: {
      type: DataTypes.ENUM('Draft', 'Submitted', 'Approved', 'Invoiced'),
      defaultValue: 'Draft'
    },
    costRate: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    billingRate: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    }
  });

  return Timesheet;
};
