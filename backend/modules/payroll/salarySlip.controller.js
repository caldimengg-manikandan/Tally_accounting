const { sequelize, Employee, SalarySlip, PayrollSettings, EmployeeSalaryAssignment, SalaryStructure, SalaryStructureComponent, SalaryComponent, Ledger, JournalEntry, JournalEntryItem } = require('../../models');
const { Op } = require('sequelize');
const SalaryService = require('./salary.service');

exports.getEmployeesForSelection = async (req, res) => {
  try {
    const { companyId } = req.params;
    
    console.log('Fetching employees for company:', companyId);

    const employees = await Employee.findAll({
      where: { CompanyId: companyId, status: 'Active' },
      include: [{
        model: EmployeeSalaryAssignment,
        where: { isActive: true },
        required: false,
        include: [{
          model: SalaryStructure,
          as: 'structure'
        }]
      }],
      order: [['employeeId', 'ASC']]
    });

    const formatted = employees.map(emp => {
      let gross = 0;
      if (emp.EmployeeSalaryAssignments && emp.EmployeeSalaryAssignments.length > 0) {
        const struct = emp.EmployeeSalaryAssignments[0].structure;
        if (struct) {
          gross = parseFloat(struct.grossSalary || 0);
        }
      }
      return {
        id: emp.id,
        employee_id: emp.id,
        emp_code: emp.employeeId,
        name: emp.name,
        first_name: emp.firstName || emp.name,
        last_name: emp.lastName || '',
        department: emp.department,
        designation: emp.designation,
        hasBankAccount: !!emp.bankAccountNumber,
        hasSalaryStructure: gross > 0,
        gross_salary_estimated: gross
      };
    });
    
    console.log('Found employees:', formatted.length);

    res.json({ success: true, employees: formatted, count: formatted.length });
  } catch (err) {
    console.error('Error fetching employees:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.calculateSingleSalary = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { employeeId } = req.body;

    const emp = await Employee.findOne({
      where: { id: employeeId, CompanyId: companyId },
      include: [{
        model: EmployeeSalaryAssignment,
        where: { isActive: true },
        required: true,
        include: [{
          model: SalaryStructure,
          as: 'structure',
          include: [{
            model: SalaryStructureComponent,
            as: 'components',
            include: [{ model: SalaryComponent, as: 'component' }]
          }]
        }]
      }]
    });

    if (!emp) return res.status(404).json({ error: 'Employee or active salary structure not found' });

    const assignment = emp.EmployeeSalaryAssignments[0];
    const structureComponents = assignment.structure.components || [];

    const breakdown = await SalaryService.calculateSalaryBreakdown(
      Number(assignment.ctcAmount || 0),
      structureComponents,
      assignment.basicAmount ? Number(assignment.basicAmount) : null,
      companyId
    );

    const basic = breakdown.breakdown['BASIC'] || 0;
    const hra = breakdown.breakdown['HRA'] || 0;
    const da = breakdown.breakdown['DA'] || 0;
    const special = breakdown.breakdown['SPECIAL_ALLOWANCE'] || 0;

    let other = 0;
    breakdown.components.forEach(c => {
      if (c.type === 'Earning' && !['BASIC', 'HRA', 'DA', 'SPECIAL_ALLOWANCE'].includes(c.code)) {
        other += (breakdown.breakdown[c.code] || 0);
      }
    });

    const pfEmployee = breakdown.pf || 0;
    // Basic employer cost logic: employer matches employee PF typically
    const pfEmployer = pfEmployee; 
    const esiEmployee = breakdown.esi || 0;
    const esiEmployer = breakdown.esi ? Number((breakdown.grossEarnings * 3.25 / 100).toFixed(2)) : 0;
    const ptDeduction = breakdown.pt || 0;
    const monthlyTax = breakdown.tds || 0;
    
    // total_deductions from breakdown
    const totalDeductions = breakdown.totalDeductions;
    const netSalary = breakdown.netPay;
    const employerCost = breakdown.grossEarnings + pfEmployer + esiEmployer;

    res.json({
      employee_id: emp.id,
      name: emp.name,
      components: { basic, hra, da, special, other },
      gross_salary: breakdown.grossEarnings,
      pf_employee: pfEmployee,
      pf_employer: pfEmployer,
      esi_employee: esiEmployee,
      esi_employer: esiEmployer,
      income_tax: monthlyTax,
      professional_tax: ptDeduction,
      other_deductions: 0,
      total_deductions: totalDeductions,
      net_salary: netSalary,
      total_employer_cost: employerCost
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.processMonth = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { companyId } = req.params;
    const { salary_month, employees, calculations } = req.body;
    // salary_month format: "2024-05-01"
    const dateObj = new Date(salary_month);
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    const slipPrefix = `${dateObj.toLocaleString('default', { month: 'short' }).toUpperCase()}-${year}-`;

    const createdSlips = [];
    let summary = {
      total_gross: 0,
      total_deductions: 0,
      total_net: 0,
      total_employer_cost: 0,
      slip_numbers: []
    };

    let counter = 1;
    for (const calc of calculations) {
      const slipNumber = `${slipPrefix}${String(counter).padStart(3, '0')}`;
      
      const slip = await SalarySlip.create({
        companyId,
        employeeId: calc.employee_id,
        slipNumber,
        salaryMonth: salary_month,
        salaryYear: year,
        slipStatus: 'DRAFT',
        basicSalary: calc.components.basic,
        hra: calc.components.hra,
        da: calc.components.da,
        specialAllowance: calc.components.special,
        otherAllowances: calc.components.other,
        grossSalary: calc.gross_salary,
        pfEmployeeContribution: calc.pf_employee,
        pfEmployerContribution: calc.pf_employer,
        esiEmployeeContribution: calc.esi_employee,
        esiEmployerContribution: calc.esi_employer,
        incomeTax: calc.income_tax,
        professionalTax: calc.professional_tax,
        otherDeductions: calc.other_deductions,
        totalDeductions: calc.total_deductions,
        netSalary: calc.net_salary,
        totalEmployerCost: calc.total_employer_cost,
        createdBy: req.user.id
      }, { transaction: t });

      createdSlips.push(slip);
      summary.total_gross += calc.gross_salary;
      summary.total_deductions += calc.total_deductions;
      summary.total_net += calc.net_salary;
      summary.total_employer_cost += calc.total_employer_cost;
      summary.slip_numbers.push(slipNumber);
      counter++;
    }

    await t.commit();

    res.json({
      success: true,
      message: `Processed ${createdSlips.length} employees`,
      salary_slips: createdSlips,
      summary
    });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
};

exports.getSalarySlipDetails = async (req, res) => {
  try {
    const { slipId } = req.params;
    const slip = await SalarySlip.findByPk(slipId, {
      include: [{ model: Employee, attributes: ['name', 'employeeId', 'department', 'designation'] }]
    });
    if (!slip) return res.status(404).json({ error: 'Slip not found' });
    res.json({ salary_slip: slip });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllSlipsForMonth = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { month } = req.query; // "2024-05-01"

    const slips = await SalarySlip.findAll({
      where: { companyId, salaryMonth: month },
      include: [{ model: Employee, attributes: ['name', 'employeeId'] }],
      order: [['slipNumber', 'ASC']]
    });
    
    res.json({ slips });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
