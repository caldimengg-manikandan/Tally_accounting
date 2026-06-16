const { Employee, Attendance, SalaryStructure, Payslip, Ledger, Group, Voucher, Transaction, PayrollSettings, sequelize } = require('../../models');
const { Op } = require('sequelize');
const AccountingService = require('../../services/AccountingService');

// --- Employee CRUD ---
exports.createEmployee = async (req, res) => {
  try {
    const employee = await Employee.create({ ...req.body, CompanyId: req.body.companyId });
    res.status(201).json(employee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getEmployees = async (req, res) => {
  try {
    const { companyId } = req.params;
    const employees = await Employee.findAll({ 
      where: { CompanyId: companyId },
      include: [{ model: SalaryStructure }]
    });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    await employee.update(req.body);
    res.json(employee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    await employee.destroy();
    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- Salary Structure ---
exports.saveSalaryStructure = async (req, res) => {
  try {
    const { employeeId, annualCtc, companyId, monthlyBasic, monthlyFixedAllowance, annualBasic, annualFixedAllowance, hraMonthly, hraAnnual } = req.body;
    
    const ctc = parseFloat(annualCtc || 0);

    // Use SalaryStructure.upsert() to dynamically save or update this compensation contract
    const [struct] = await SalaryStructure.upsert({
      EmployeeId: employeeId,
      CompanyId: companyId || req.params.companyId,
      annualCtc: ctc,
      monthlyBasic: monthlyBasic || 0,
      monthlyFixedAllowance: monthlyFixedAllowance || 0,
      annualBasic: annualBasic || 0,
      annualFixedAllowance: annualFixedAllowance || 0,
      monthlyHra: hraMonthly || 0,
      annualHra: hraAnnual || 0
    });

    res.json(struct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- Attendance Log ---
exports.saveAttendance = async (req, res) => {
  try {
    const { employeeId, date, status, remarks, companyId } = req.body;
    let attendance = await Attendance.findOne({ where: { EmployeeId: employeeId, date } });
    if (attendance) {
      await attendance.update({ status, remarks });
    } else {
      attendance = await Attendance.create({
        EmployeeId: employeeId, date, status, remarks, CompanyId: companyId
      });
    }
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAttendanceRange = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { startDate, endDate } = req.query;
    
    const whereClause = {};
    if (startDate && endDate) {
      whereClause.date = { [Op.between]: [startDate, endDate] };
    }

    const attendance = await Attendance.findAll({
      where: whereClause,
      include: [{
        model: Employee,
        where: { CompanyId: companyId },
        attributes: ['id', 'name', 'employeeId']
      }]
    });
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- Payroll Settings ---
exports.getSettings = async (req, res) => {
  try {
    const { companyId } = req.params;
    let settings = await PayrollSettings.findOne({ where: { CompanyId: companyId } });
    if (!settings) {
      settings = await PayrollSettings.create({ CompanyId: companyId });
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.saveSettings = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { pfEmployeeRate, esiEmployeeRate, ptMonthlyAmount } = req.body;
    let settings = await PayrollSettings.findOne({ where: { CompanyId: companyId } });
    if (!settings) {
      settings = await PayrollSettings.create({ CompanyId: companyId, pfEmployeeRate, esiEmployeeRate, ptMonthlyAmount });
    } else {
      await settings.update({ pfEmployeeRate, esiEmployeeRate, ptMonthlyAmount });
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- Payroll Processing Engine ---
exports.processPayroll = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { companyId, month, year, paymentLedgerId, date } = req.body;

    const employees = await Employee.findAll({
      where: { CompanyId: companyId, active: true },
      include: [{ model: SalaryStructure }],
      transaction: t
    });

    if (employees.length === 0) {
      await t.rollback();
      return res.status(400).json({ error: 'No active employees found to process.' });
    }

    // 1. Resolve self-healing salary-related Ledgers
    let salaryExpenseLedger = await Ledger.findOne({
      where: { CompanyId: companyId, name: { [Op.like]: '%Salaries%' } },
      transaction: t
    });
    if (!salaryExpenseLedger) {
      const expGroup = await Group.findOne({ where: { CompanyId: companyId, name: { [Op.like]: '%Indirect%Expense%' } }, transaction: t });
      salaryExpenseLedger = await Ledger.create({
        name: 'Salaries & Wages', code: 'EXP-PAY01', category: 'Expense', groupName: 'Indirect Expenses',
        GroupId: expGroup ? expGroup.id : null, CompanyId: companyId, currentBalance: 0
      }, { transaction: t });
    }

    let pfPayableLedger = await Ledger.findOne({
      where: { CompanyId: companyId, name: { [Op.like]: '%PF%Payable%' } },
      transaction: t
    });
    if (!pfPayableLedger) {
      const liabGroup = await Group.findOne({ where: { CompanyId: companyId, name: { [Op.like]: '%Duties%' } }, transaction: t });
      pfPayableLedger = await Ledger.create({
        name: 'PF Payable', code: 'LIA-PAY02', category: 'Liability', groupName: 'Duties & Taxes',
        GroupId: liabGroup ? liabGroup.id : null, CompanyId: companyId, currentBalance: 0
      }, { transaction: t });
    }

    let esiPayableLedger = await Ledger.findOne({
      where: { CompanyId: companyId, name: { [Op.like]: '%ESI%Payable%' } },
      transaction: t
    });
    if (!esiPayableLedger) {
      const liabGroup = await Group.findOne({ where: { CompanyId: companyId, name: { [Op.like]: '%Duties%' } }, transaction: t });
      esiPayableLedger = await Ledger.create({
        name: 'ESI Payable', code: 'LIA-PAY03', category: 'Liability', groupName: 'Duties & Taxes',
        GroupId: liabGroup ? liabGroup.id : null, CompanyId: companyId, currentBalance: 0
      }, { transaction: t });
    }

    let ptPayableLedger = await Ledger.findOne({
      where: { CompanyId: companyId, name: { [Op.like]: '%Professional%Tax%' } },
      transaction: t
    });
    if (!ptPayableLedger) {
      const liabGroup = await Group.findOne({ where: { CompanyId: companyId, name: { [Op.like]: '%Duties%' } }, transaction: t });
      ptPayableLedger = await Ledger.create({
        name: 'Professional Tax Payable', code: 'LIA-PAY04', category: 'Liability', groupName: 'Duties & Taxes',
        GroupId: liabGroup ? liabGroup.id : null, CompanyId: companyId, currentBalance: 0
      }, { transaction: t });
    }

    let settings = await PayrollSettings.findOne({ where: { CompanyId: companyId }, transaction: t });
    if (!settings) {
      settings = { pfEmployeeRate: 12.00, esiEmployeeRate: 0.75, ptMonthlyAmount: 200.00 };
    }

    let totalGrossSalary = 0;
    let totalNetSalary = 0;
    let totalPF = 0;
    let totalESI = 0;
    let totalPT = 0;

    const payslips = [];

    // Calculate details for each employee
    for (const emp of employees) {
      const struct = emp.SalaryStructure;
      if (!struct) continue;

      // Count unpaid absents in the processing month
      const daysInMonth = new Date(year, new Date(`${month} 1, ${year}`).getMonth() + 1, 0).getDate();
      const startDate = `${year}-${String(new Date(`${month} 1, ${year}`).getMonth() + 1).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(new Date(`${month} 1, ${year}`).getMonth() + 1).padStart(2, '0')}-${daysInMonth}`;

      const absentCount = await Attendance.count({
        where: {
          EmployeeId: emp.id,
          status: 'Absent',
          date: { [Op.between]: [startDate, endDate] }
        },
        transaction: t
      });

      // Deduct basic pay proportionally for absent days
      const basic = parseFloat(struct.monthlyBasic || 0);
      const absentDeduction = absentCount > 0 ? (basic / daysInMonth) * absentCount : 0;
      const actualBasic = Math.max(0, basic - absentDeduction);

      const hra = parseFloat(struct.monthlyHra || 0);
      const actualHra = Math.max(0, hra - (absentCount > 0 ? (hra / daysInMonth) * absentCount : 0));
      
      const fixedAllowance = parseFloat(struct.monthlyFixedAllowance || 0);
      const actualFixedAllowance = Math.max(0, fixedAllowance - (absentCount > 0 ? (fixedAllowance / daysInMonth) * absentCount : 0));

      const gross = actualBasic + actualHra + actualFixedAllowance;
      
      // Calculate Deductions dynamically based on Settings
      const pf = Math.round(actualBasic * (parseFloat(settings.pfEmployeeRate) / 100));
      const esi = Math.round(gross * (parseFloat(settings.esiEmployeeRate) / 100));
      const pt = parseFloat(settings.ptMonthlyAmount || 0);

      const deductions = pf + esi + pt;
      const net = Math.max(0, gross - deductions);

      totalGrossSalary += gross;
      totalNetSalary += net;
      totalPF += pf;
      totalESI += esi;
      totalPT += pt;

      const payslip = await Payslip.create({
        EmployeeId: emp.id,
        month,
        year: parseInt(year),
        basic: actualBasic,
        hra: actualHra,
        da: actualFixedAllowance, // Storing fixed allowance in DA field temporarily to avoid altering Payslip model
        incentives: 0,
        pf,
        esi,
        profTax: pt,
        netSalary: net,
        status: 'Processed',
        CompanyId: companyId
      }, { transaction: t });

      payslips.push(payslip);
    }

    if (totalNetSalary <= 0) {
      await t.rollback();
      return res.status(400).json({ error: 'Gross payroll calculations computed to zero.' });
    }

    // 2. Prepare Double-Entry Postings
    const journalEntries = [
      { ledgerId: salaryExpenseLedger.id, debit: totalGrossSalary, credit: 0 },
      { ledgerId: paymentLedgerId, debit: 0, credit: totalNetSalary }
    ];

    if (totalPF > 0) {
      journalEntries.push({ ledgerId: pfPayableLedger.id, debit: 0, credit: totalPF });
    }
    if (totalESI > 0) {
      journalEntries.push({ ledgerId: esiPayableLedger.id, debit: 0, credit: totalESI });
    }
    if (totalPT > 0) {
      journalEntries.push({ ledgerId: ptPayableLedger.id, debit: 0, credit: totalPT });
    }

    // 3. Post to universal journal engine
    const voucher = await AccountingService.recordJournalEntry({
      companyId,
      date: date || new Date(),
      voucherType: 'Payment',
      narration: `Salary processed for the month of ${month} ${year}. Total Employees: ${payslips.length}`,
      entries: journalEntries,
      userId: req.user?.id
    }, t);

    // Link Payslips to Voucher
    for (const ps of payslips) {
      await ps.update({ VoucherId: voucher.id, status: 'Paid' }, { transaction: t });
    }

    await t.commit();
    res.status(201).json({ message: 'Payroll processed and posted successfully', voucher, payslips });
  } catch (err) {
    if (t) await t.rollback();
    console.error('Error processing payroll:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getPayslips = async (req, res) => {
  try {
    const { companyId } = req.params;
    const payslips = await Payslip.findAll({
      include: [{ 
        model: Employee,
        where: { CompanyId: companyId }
      }]
    });
    res.json(payslips);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
