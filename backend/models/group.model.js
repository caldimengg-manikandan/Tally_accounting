module.exports = (sequelize, DataTypes) => {
  const Group = sequelize.define('Group', {
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
    nature: {
      type: DataTypes.ENUM('Assets', 'Liabilities', 'Income', 'Expenses'),
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM('Primary', 'Sub-Group'),
      defaultValue: 'Primary'
    },
    parent_id: {
      type: DataTypes.UUID,
      allowNull: true
    }
  });

  return Group;
};
