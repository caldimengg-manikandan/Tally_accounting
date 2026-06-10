module.exports = (sequelize, DataTypes) => {
  const RefreshToken = sequelize.define('RefreshToken', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    deviceInfo: {
      type: DataTypes.STRING,
      allowNull: true
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    replacedByToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    UserId: {
      type: DataTypes.UUID,
      allowNull: false
    }
  });

  return RefreshToken;
};
