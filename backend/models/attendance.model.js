module.exports = (sequelize, DataTypes) => {
  const Attendance = sequelize.define('Attendance', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('Present', 'Absent', 'Leave'),
      defaultValue: 'Present'
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  });

  return Attendance;
};
