module.exports = (sequelize, DataTypes) => {
  const Ledger = sequelize.define('Ledger', {
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
    displayName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    openingBalance: {
      type: DataTypes.DOUBLE,
      defaultValue: 0.00
    },
    openingBalanceType: {
      type: DataTypes.ENUM('Dr', 'Cr'),
      defaultValue: 'Dr'
    },
    currentBalance: {
      type: DataTypes.DOUBLE,
      defaultValue: 0.00
    },
    groupName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Banking Specific Fields
    accountNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    bankName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ifsc: {
      type: DataTypes.STRING,
      allowNull: true
    },
    accountCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Customer/Vendor Specific Fields
    customerType: {
      type: DataTypes.ENUM('Business', 'Individual'),
      defaultValue: 'Business'
    },
    salutation: {
      type: DataTypes.STRING,
      allowNull: true
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    gstNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isValidGstin(value) {
          if (value && value.trim() !== '') {
            const trimmedValue = value.trim().toUpperCase();
            if (trimmedValue.length !== 15) {
              throw new Error('GSTIN must be exactly 15 characters.');
            }
            const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
            if (!gstRegex.test(trimmedValue)) {
              throw new Error('Invalid GSTIN format. Expected format: 22AAAAA0000A1Z5');
            }
            const stateCode = parseInt(trimmedValue.substring(0, 2), 10);
            if (stateCode < 1 || stateCode > 38) {
              throw new Error('Invalid GSTIN: State code (first 2 digits) must be between 01 and 38.');
            }
          }
        }
      }
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Maharashtra'
    },
    registrationType: {
      type: DataTypes.ENUM('Registered', 'Unregistered', 'Consumer', 'Overseas'),
      defaultValue: 'Registered'
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    workPhone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    mobile: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phone: { // Kept for legacy compatibility
      type: DataTypes.STRING,
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    creditLimit: {
      type: DataTypes.DOUBLE,
      defaultValue: 0.00
    },
    language: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'English'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    billingAddressJson: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    shippingAddressJson: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    contactPersonsJson: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    billingAddress: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    shippingAddress: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true
    },
    department: {
      type: DataTypes.STRING,
      allowNull: true
    },
    designation: {
      type: DataTypes.STRING,
      allowNull: true
    },
    twitter: {
      type: DataTypes.STRING,
      allowNull: true
    },
    skype: {
      type: DataTypes.STRING,
      allowNull: true
    },
    facebook: {
      type: DataTypes.STRING,
      allowNull: true
    },
    pan: {
      type: DataTypes.STRING,
      allowNull: true
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'INR'
    },
    receivableAccount: {
      type: DataTypes.STRING,
      allowNull: true
    },
    paymentTerms: {
      type: DataTypes.STRING,
      allowNull: true
    },
    portalEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    documentsJson: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    bankDetailsJson: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    image: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    tdsApplicable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    tds_section: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tds_rate: {
      type: DataTypes.DOUBLE,
      allowNull: true
    }
  }, {
    paranoid: true
  });

  return Ledger;
};
