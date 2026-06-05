module.exports = (sequelize, DataTypes) => {
  const Voucher = sequelize.define('Voucher', {
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
    voucherType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['Payment', 'Receipt', 'Sales', 'Purchase', 'Journal', 'Contra', 'Debit Note', 'Credit Note', 'Quote']]
      }
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    narration: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    reference: {
      type: DataTypes.STRING,
      allowNull: true
    },
    voucherNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    reportingMethod: {
      type: DataTypes.STRING,
      allowNull: true
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ProjectId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    CompanyId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: null
    },
    UserId: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    paranoid: true
  });

  return Voucher;
};
