module.exports = (sequelize, DataTypes) => {
  const DepreciationLog = sequelize.define('DepreciationLog', {
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
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    bookValueBefore: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    bookValueAfter: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    }
  });

  return DepreciationLog;
};
