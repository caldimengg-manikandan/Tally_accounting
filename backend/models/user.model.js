module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
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
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'ADMIN'
    },
    activeCompanyId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    // Phase 1: marks accounts created via Google OAuth — blocks password login
    oauthOnly: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    // Extra 3: account lockout after repeated failed login attempts
    failedLoginAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    lockedUntil: {
      type: DataTypes.DATE,
      allowNull: true  // null = not locked
    }
  });

  return User;
};
