module.exports = (sequelize, DataTypes) => {
  const Attendance = sequelize.define('Attendance', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    CompanyId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Companies', key: 'id' }
    },
    EmployeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Employees', key: 'id' }
    },
    AttendanceDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    Status: {
      type: DataTypes.ENUM(
        'Present', 'Absent', 'Half-Day', 'Leave',
        'Sick-Leave', 'Casual-Leave', 'Earned-Leave',
        'Comp-Off', 'Holiday'
      ),
      allowNull: false,
      defaultValue: 'Present'
    },
    LeaveType: {
      type: DataTypes.STRING,
      allowNull: true
    },
    WorkingHours: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    Notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    CheckInTime: {
      type: DataTypes.STRING, // stored as 'HH:MM' string
      allowNull: true
    },
    CheckOutTime: {
      type: DataTypes.STRING, // stored as 'HH:MM' string
      allowNull: true
    },
    IsApproved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    ApprovedBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    ApprovedDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    Latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    Longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    },
    CreatedBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    UpdatedBy: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['CompanyId', 'EmployeeId', 'AttendanceDate'],
        name: 'unique_company_employee_date'
      },
      { fields: ['CompanyId', 'EmployeeId'] },
      { fields: ['AttendanceDate'] }
    ]
  });

  return Attendance;
};
