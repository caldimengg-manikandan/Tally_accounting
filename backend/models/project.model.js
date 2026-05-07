module.exports = (sequelize, DataTypes) => {
  const Project = sequelize.define('Project', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    projectCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    billingMethod: {
      type: DataTypes.ENUM('Hourly Project Rate', 'Hourly Staff Rate', 'Hourly Task Rate', 'Fixed Cost'),
      defaultValue: 'Hourly Project Rate'
    },
    budgetType: {
      type: DataTypes.ENUM('None', 'Total Hours', 'Total Amount'),
      defaultValue: 'None'
    },
    costBudget: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    revenueBudget: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    addToWatchlist: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    budgetAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    ratePerHour: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('Active', 'On Hold', 'Finished', 'Cancelled'),
      defaultValue: 'Active'
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    CompanyId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    customerLedgerId: {
      type: DataTypes.UUID,
      allowNull: true
    }
  });

  return Project;
};
