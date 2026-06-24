module.exports = (sequelize, DataTypes) => {
  const Company = sequelize.define('Company', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
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
    gstNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true
    },
    panNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    logoUrl: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    industry: {
      type: DataTypes.STRING,
      allowNull: true
    },
    location: {
      type: DataTypes.STRING,
      defaultValue: 'India'
    },
    street1: {
      type: DataTypes.STRING,
      allowNull: true
    },
    street2: {
      type: DataTypes.STRING,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true
    },
    pincode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    faxNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true
    },
    baseCurrency: {
      type: DataTypes.STRING,
      defaultValue: 'INR'
    },
    fiscalYear: {
      type: DataTypes.STRING,
      defaultValue: 'April - March'
    },
    reportBasis: {
      type: DataTypes.STRING,
      defaultValue: 'Accrual'
    },
    language: {
      type: DataTypes.STRING,
      defaultValue: 'English'
    },
    timezone: {
      type: DataTypes.STRING,
      defaultValue: '(GMT 5:30) India Standard Time (Asia/Calcutta)'
    },
    dateFormat: {
      type: DataTypes.STRING,
      defaultValue: 'dd/MM/yyyy'
    },
    organizationId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    financialYearStart: {
      type: DataTypes.DATE,
      allowNull: false
    },
    booksBeginningFrom: {
      type: DataTypes.DATE,
      allowNull: true
    },
    features: {
      type: DataTypes.JSON,
      defaultValue: {
        maintainAccountsOnly: false,
        integrateAccountsInventory: true,
        multiCurrency: false,
        billWiseDetails: true,
        zeroValuedTransactions: false,
        multipleGodowns: false,
        stockCategories: false,
        purchaseOrders: true
      }
    },
    additionalFields: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    // SaaS Billing & Trial Fields
    accountType: {
      type: DataTypes.STRING,
      defaultValue: 'Business' // 'Business' or 'Student'
    },
    trialStartDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    trialEndsAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    subscriptionStatus: {
      type: DataTypes.STRING,
      defaultValue: 'Trialing' // 'Trialing', 'Grace_Period', 'Active', 'Past_Due', 'Canceled'
    },
    planId: {
      type: DataTypes.UUID,
      allowNull: true // Can be null if custom or totally free
    }
  });

  return Company;
};
