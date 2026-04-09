module.exports = (sequelize, DataTypes) => {
  const RetainerAdjustment = sequelize.define('RetainerAdjustment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    RetainerInvoiceId: {
       type: DataTypes.UUID,
       allowNull: false
    },
    InvoiceId: {
       type: DataTypes.UUID,
       allowNull: false
    },
    amountToAdjust: {
       type: DataTypes.DECIMAL(15, 2),
       allowNull: false
    },
    adjustmentDate: {
       type: DataTypes.DATE,
       defaultValue: DataTypes.NOW
    },
    CompanyId: {
       type: DataTypes.UUID,
       allowNull: false
    }
  });

  return RetainerAdjustment;
};
