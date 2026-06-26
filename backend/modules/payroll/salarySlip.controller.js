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
      let hasStructure = false;
      if (emp.EmployeeSalaryAssignments && emp.EmployeeSalaryAssignments.length > 0) {
        const assignment = emp.EmployeeSalaryAssignments[0];
        hasStructure = true;
        if (assignment.ctcAmount) {
           // Provide a rough estimate of gross salary for the UI (CTC / 12)
           // Actual calculation happens in the next step
           gross = parseFloat(assignment.ctcAmount) / 12;
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
        hasSalaryStructure: hasStructure,
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
    
    // Fetch structure components separately to avoid Sequelize deeply nested alias truncation bug
    const structureComponents = await SalaryStructureComponent.findAll({
      where: { SalaryStructureId: assignment.SalaryStructureId, isActive: true },
      include: [{ model: SalaryComponent, as: 'component' }]
    });

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

    const pfEmployee = breakdown.breakdown['PF_EMP'] || breakdown.breakdown['PF'] || 0;
    const pfEmployer = breakdown.breakdown['PF_EMPLOYER'] || pfEmployee; 
    const esiEmployee = breakdown.breakdown['ESI_EMP'] || breakdown.breakdown['ESI'] || 0;
    const esiEmployer = esiEmployee > 0 ? Number((breakdown.grossEarnings * 3.25 / 100).toFixed(2)) : 0;
    const ptDeduction = breakdown.breakdown['PT'] || 0;
    const monthlyTax = breakdown.breakdown['TDS'] || breakdown.breakdown['INCOME_TAX'] || 0;
    
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

    // Delete existing DRAFT slips for the selected employees in this month
    await SalarySlip.destroy({
      where: {
        companyId,
        salaryMonth: salary_month,
        employeeId: employees,
        slipStatus: 'DRAFT'
      },
      transaction: t
    });

    // Find the max slip number to continue sequence
    const maxSlip = await SalarySlip.findOne({
      where: { companyId, salaryMonth: salary_month },
      order: [['slipNumber', 'DESC']],
      transaction: t
    });

    let counter = 1;
    if (maxSlip && maxSlip.slipNumber) {
      const match = maxSlip.slipNumber.match(/-(\d+)$/);
      if (match) {
        counter = parseInt(match[1], 10) + 1;
      }
    }

    const createdSlips = [];
    let summary = {
      total_gross: 0,
      total_deductions: 0,
      total_net: 0,
      total_employer_cost: 0,
      slip_numbers: []
    };

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
      include: [{ model: Employee, attributes: ['name', 'employeeId', 'department'] }]
    });
    res.json({ salary_slips: slips });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const PDFService = require('../../services/PDFService');
exports.exportPayslipPDF = async (req, res) => {
  try {
    const { slipId } = req.params;
    const slip = await SalarySlip.findByPk(slipId, {
      include: [
        { model: Employee },
        { model: sequelize.models.Company }
      ]
    });

    if (!slip) return res.status(404).json({ error: 'Salary slip not found' });

    const pdfBuffer = await PDFService.generatePayslipPDF(slip, slip.Company || {}, slip.Employee || {});

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=payslip_${slip.slipNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF Export Error:', err);
    res.status(500).json({ error: 'Failed to generate Payslip PDF' });
  }
};
