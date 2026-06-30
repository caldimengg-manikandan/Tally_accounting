module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define('AuditLog', {
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
    action: {
      type: DataTypes.STRING,
      allowNull: false
    },
    tableName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    recordId: {
      type: DataTypes.STRING,   // UUID or integer — store as string
      allowNull: true
    },
    oldData: {    
      type: DataTypes.TEXT,     // Store JSON as text — compatible with SQLite
      allowNull: true,
      get() {
        const raw = this.getDataValue('oldData');
        try { return raw ? JSON.parse(raw) : null; } catch { return raw; }
      },
      set(val) {
        this.setDataValue('oldData', val ? JSON.stringify(val) : null);
      }
    },
    newData: {
      type: DataTypes.TEXT,     // Store JSON as text — compatible with SQLite
      allowNull: true,
      get() {
        const raw = this.getDataValue('newData');
        try { return raw ? JSON.parse(raw) : null; } catch { return raw; }
      },
      set(val) {
        this.setDataValue('newData', val ? JSON.stringify(val) : null);
      }
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true
    },
    userAgent: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ProjectId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    CompanyId: {
      type: DataTypes.UUID,
      allowNull: true
    }
  });

  return AuditLog;
};
