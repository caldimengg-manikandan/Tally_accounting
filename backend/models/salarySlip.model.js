module.exports = (sequelize, DataTypes) => {
  const SalarySlip = sequelize.define('SalarySlip', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'salary_slip_id'
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'company_id'
    },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'employee_id'
    },
    slipNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'slip_number'
    },
    salaryMonth: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'salary_month'
    },
    salaryYear: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'salary_year'
    },
    slipStatus: {
      type: DataTypes.STRING(50),
      defaultValue: 'DRAFT',
      field: 'slip_status'
    },
    
    // EARNINGS
    basicSalary: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'basic_salary' },
    hra: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    da: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    specialAllowance: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'special_allowance' },
    otherAllowances: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'other_allowances' },
    grossSalary: { type: DataTypes.DECIMAL(12, 2), allowNull: false, field: 'gross_salary' },
    
    // DEDUCTIONS - STATUTORY
    pfEmployeeContribution: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'pf_employee_contribution' },
    pfEmployerContribution: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'pf_employer_contribution' },
    esiEmployeeContribution: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'esi_employee_contribution' },
    esiEmployerContribution: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'esi_employer_contribution' },
    incomeTax: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'income_tax' },
    professionalTax: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'professional_tax' },
    
    // DEDUCTIONS - OTHER
    otherDeductions: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'other_deductions' },
    
    // TOTALS
    totalDeductions: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'total_deductions' },
    netSalary: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'net_salary' },
    totalEmployerCost: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'total_employer_cost' },
    
    // PAYMENT INFO
    paymentDate: { type: DataTypes.DATEONLY, field: 'payment_date' },
    paymentStatus: { type: DataTypes.STRING(50), defaultValue: 'PENDING', field: 'payment_status' },
    
    // POSTING
    postedToLedger: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'posted_to_ledger' },
    journalEntryId: { type: DataTypes.UUID, field: 'journal_entry_id' },
    
    // SYSTEM
    createdBy: { type: DataTypes.UUID, field: 'created_by' },
  }, {
    tableName: 'salary_slips',
    timestamps: true,
    createdAt: 'created_date',
    updatedAt: 'updated_date',
    indexes: [
      {
        unique: true,
        fields: ['employee_id', 'salary_month'],
        name: 'unique_emp_month'
      },
      {
        fields: ['salary_month'],
        name: 'idx_month'
      }
    ]
  });

  SalarySlip.associate = function(models) {
    SalarySlip.belongsTo(models.Company, { foreignKey: 'companyId' });
    SalarySlip.belongsTo(models.Employee, { foreignKey: 'employeeId' });
    // Optional link to JournalEntry if available
    if (models.JournalEntry) {
      SalarySlip.belongsTo(models.JournalEntry, { foreignKey: 'journalEntryId' });
    }
  };

  return SalarySlip;
};
