module.exports = (sequelize, DataTypes) => {
  const SystemMail = sequelize.define('SystemMail', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    CreatedBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    ModifiedBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    toEmail: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fromEmail: {
      type: DataTypes.STRING,
      allowNull: true
    },
    sentAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.ENUM('Sent', 'Failed'),
      defaultValue: 'Sent'
    },
    type: {
      type: DataTypes.STRING, // e.g., 'Vendor', 'Customer', 'Quote', 'Statement'
      defaultValue: 'General'
    }
  });

  return SystemMail;
};
