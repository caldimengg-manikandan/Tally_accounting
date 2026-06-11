module.exports = (sequelize, DataTypes) => {
  const RefreshToken = sequelize.define('RefreshToken', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    // Stores the SHA-256 hash of the raw token, never the raw value itself
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
    // Phase 2: replay detection — once used in rotation, mark true; second use = token theft
    used: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    UserId: {
      type: DataTypes.UUID,
      allowNull: false
    }
  });

  return RefreshToken;
};
