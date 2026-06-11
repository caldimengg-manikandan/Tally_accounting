module.exports = (sequelize, DataTypes) => {
  const MfaSecret = sequelize.define('MfaSecret', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      // One MFA secret per user
      unique: true
    },
    // TOTP secret in base32 encoding.
    // TODO (production): encrypt this at rest using AES-256 before storing.
    secret: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // false until the user confirms the first TOTP code after scanning the QR
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    }
  });

  return MfaSecret;
};
