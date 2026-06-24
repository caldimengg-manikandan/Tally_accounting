module.exports = (sequelize, DataTypes) => {
  const SupportTicket = sequelize.define('SupportTicket', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'Open' // 'Open', 'In_Progress', 'Resolved', 'Closed'
    },
    currentPageUrl: {
      type: DataTypes.STRING,
      allowNull: true // Automatically captures where the user was when they clicked Help
    },
    adminReply: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  });

  return SupportTicket;
};
