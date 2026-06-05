module.exports = (sequelize, DataTypes) => {
  const BankTransaction = sequelize.define('BankTransaction', {
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
    date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('Debit', 'Credit'),
      allowNull: false
    },
    isMatched: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    matchedVoucherId: {
      type: DataTypes.UUID,
      allowNull: true
    }
  });

  return BankTransaction;
};
