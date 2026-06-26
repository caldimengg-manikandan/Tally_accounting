const { Employee, Attendance, SalaryStructure, EmployeeSalaryAssignment, SalaryStructureComponent, SalaryComponent, SalarySlip, Ledger, Group, Voucher, Transaction, PayrollSettings, Company, sequelize } = require('../../models');
const { Op } = require('sequelize');
const AccountingService = require('../../services/AccountingService');
const PDFService = require('../../services/PDFService');
const SalaryService = require('./salary.service');

// --- Helper: Generate Employee ID code ---
const generateEmployeeCode = async (companyId) => {
  try {
    const employees = await Employee.findAll({
      where: { CompanyId: companyId },
      paranoid: false,
      attributes: ['employeeId']
    });
    
    let maxNum = 0;
    for (const emp of employees) {
      const match = emp.employeeId.match(/^EMP-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxNum) maxNum = num;
      }
    }
    
    const nextNum = maxNum + 1;
    return `EMP-${String(nextNum).padStart(3, '0')}`;
  } catch (e) {
    console.error('Error generating employee code:', e.message);
    return 'EMP-001';
  }
};

// --- Real-time Uniqueness Validation Checks ---
exports.validateEmail = async (req, res) => {
  try {
    const { workEmail, excludeId } = req.body;
    if (!workEmail) return res.json({ available: true });
    
    const where = { workEmail, CompanyId: req.companyId || req.body.CompanyId };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    
    const count = await Employee.count({ where, paranoid: false });
    res.json({ available: count === 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.validatePan = async (req, res) => {
  try {
    const { panNumber, excludeId } = req.body;
    if (!panNumber) return res.json({ available: true });
    
    const where = { panNumber };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    
    const count = await Employee.count({ where, paranoid: false });
    res.json({ available: count === 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.validateAadhaar = async (req, res) => {
  try {
    const { aadhaarNumber, excludeId } = req.body;
    if (!aadhaarNumber) return res.json({ available: true });
    
    const where = { aadhaarNumber };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    
    const count = await Employee.count({ where, paranoid: false });
    res.json({ available: count === 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- Employee CRUD ---
exports.createEmployee = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    
    // Check if duplicate email/PAN/Aadhaar exists (only for non-drafts)
    if (!req.body.isDraft) {
      if (req.body.workEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(req.body.workEmail)) {
          return res.status(400).json({ error: 'Invalid work email format.' });
        }
        const emailExists = await Employee.count({ where: { workEmail: req.body.workEmail, CompanyId: companyId }, paranoid: false });
        if (emailExists > 0) return res.status(400).json({ error: 'Work Email already exists in the system.' });
      }
      if (req.body.panNumber) {
        const panExists = await Employee.count({ where: { panNumber: req.body.panNumber }, paranoid: false });
        if (panExists > 0) return res.status(400).json({ error: 'PAN number already exists in the system.' });
      }
      if (req.body.aadhaarNumber) {
        const aadhaarExists = await Employee.count({ where: { aadhaarNumber: req.body.aadhaarNumber }, paranoid: false });
        if (aadhaarExists > 0) return res.status(400).json({ error: 'Aadhaar number already exists in the system.' });
      }
    }

    const employeeId = req.body.employeeId || await generateEmployeeCode(companyId);
    const name = `${req.body.firstName || ''} ${req.body.middleName ? req.body.middleName + ' ' : ''}${req.body.lastName || ''}`.trim();

    const payload = { ...req.body };
    if (payload.previousExperience === '') payload.previousExperience = null;
    if (payload.yearOfPassing === '') payload.yearOfPassing = null;
    delete payload.email; // Prevent Sequelize error

    const employee = await Employee.create({
      ...payload,
      mobileNumber: req.body.phone || req.body.mobileNumber,
      employeeId,
      name,
      CompanyId: companyId,
      CreatedBy: req.user?.id,
      ModifiedBy: req.user?.id
    });
    
    console.log("Onboarding Payload Saved:", employee.toJSON());
    
    res.status(201).json(employee);
  } catch (err) {
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: err.errors[0].message });
    }
    console.error("Error saving employee:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getEmployees = async (req, res, next) => {
  try {
    const companyId = req.params.companyId || req.companyId;
    const { department, status, employmentType, search, page = 1, limit = 100, sortBy = 'createdAt', sortDir = 'DESC', includeArchived = 'false' } = req.query;
    
    const where = { CompanyId: companyId };
    
    if (department) where.department = department;
    if (status) where.status = status;
    if (employmentType) where.employmentType = employmentType;
    
    if (search) {
      const likeOp = process.env.DATABASE_URL ? Op.iLike : Op.like;
      where[Op.or] = [
        { name: { [likeOp]: `%${search}%` } },
        { workEmail: { [likeOp]: `%${search}%` } },
        { employeeId: { [likeOp]: `%${search}%` } }
      ];
    }
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const paranoid = includeArchived !== 'true'; // If true, shows soft-deleted ones as well
    
    const validSortFields = ['createdAt', 'firstName', 'department', 'dateOfJoining', 'employeeId', 'status', 'name', 'workEmail'];
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortDir = ['ASC', 'DESC'].includes(sortDir.toUpperCase()) ? sortDir.toUpperCase() : 'DESC';

    const { count, rows } = await Employee.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[safeSortBy, safeSortDir]],
      paranoid,
      include: [{ model: EmployeeSalaryAssignment, include: [{ model: SalaryStructure, as: 'structure' }] }]
    });
    
    // Mask sensitive fields if the current user's role is not privileged (SUPER_ADMIN, ADMIN, ACCOUNTANT)
    const isPrivileged = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'].includes(req.user?.role);
    const maskedRows = rows.map(emp => {
      const data = emp.toJSON();
      if (!isPrivileged) {
        if (data.panNumber) data.panNumber = data.panNumber.replace(/.(?=.{4})/g, '*');
        if (data.aadhaarNumber) data.aadhaarNumber = data.aadhaarNumber.replace(/.(?=.{4})/g, '*');
        if (data.bankAccountNumber) data.bankAccountNumber = data.bankAccountNumber.replace(/.(?=.{4})/g, '*');
        if (data.phone) data.phone = data.phone.substring(0, 3) + '****' + data.phone.substring(data.phone.length - 2);
      }
      return data;
    });

    res.json({
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(count / parseInt(limit)),
      employees: maskedRows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id, {
      paranoid: false, // Allow fetching archived employees
      include: [{ model: EmployeeSalaryAssignment, include: [{ model: SalaryStructure, as: 'structure' }] }]
    });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    
    // Role-based Access Check
    if (req.user?.role === 'EMPLOYEE' && req.user?.email !== employee.email) {
      return res.status(403).json({ error: 'Access denied: You can only view your own profile.' });
    }
    
    // Mask sensitive fields if the current user is not privileged or own profile
    const isPrivileged = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'].includes(req.user?.role);
    const isOwnProfile = req.user?.email === employee.email;
    
    const data = employee.toJSON();
    if (!isPrivileged && !isOwnProfile) {
      if (data.panNumber) data.panNumber = data.panNumber.replace(/.(?=.{4})/g, '*');
      if (data.aadhaarNumber) data.aadhaarNumber = data.aadhaarNumber.replace(/.(?=.{4})/g, '*');
      if (data.bankAccountNumber) data.bankAccountNumber = data.bankAccountNumber.replace(/.(?=.{4})/g, '*');
      if (data.phone) data.phone = data.phone.substring(0, 3) + '****' + data.phone.substring(data.phone.length - 2);
    }
    
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.updateEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findByPk(req.params.id, { paranoid: false });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    
    // Validate uniqueness of email/PAN/Aadhaar excluding current employee
    if (!req.body.isDraft) {
      const emailToCheck = req.body.workEmail || req.body.email;
      if (emailToCheck && emailToCheck !== employee.workEmail) {
        const emailExists = await Employee.count({ where: { workEmail: emailToCheck }, paranoid: false });
        if (emailExists > 0) return res.status(400).json({ error: 'Work Email already exists.' });
      }
      if (req.body.panNumber && req.body.panNumber !== employee.panNumber) {
        const panExists = await Employee.count({ where: { panNumber: req.body.panNumber }, paranoid: false });
        if (panExists > 0) return res.status(400).json({ error: 'PAN number already exists.' });
      }
      if (req.body.aadhaarNumber && req.body.aadhaarNumber !== employee.aadhaarNumber) {
        const aadhaarExists = await Employee.count({ where: { aadhaarNumber: req.body.aadhaarNumber }, paranoid: false });
        if (aadhaarExists > 0) return res.status(400).json({ error: 'Aadhaar number already exists.' });
      }
    }

    const name = `${req.body.firstName || ''} ${req.body.middleName ? req.body.middleName + ' ' : ''}${req.body.lastName || ''}`.trim();
    
    const payload = { ...req.body };
    if (payload.previousExperience === '') payload.previousExperience = null;
    if (payload.yearOfPassing === '') payload.yearOfPassing = null;

    const updateData = { 
      ...payload, 
      mobileNumber: req.body.phone || req.body.mobileNumber,
      name, 
      ModifiedBy: req.user?.id 
    };
    delete updateData.employeeId;
    delete updateData.email; // Prevent Sequelize error
    
    await employee.update(updateData);
    res.json(employee);
  } catch (err) {
    next(err);
  }
};

exports.deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    
    // Soft Delete (Archive) - mark status as Inactive and paranoid destroy
    await employee.update({ status: 'Inactive', ModifiedBy: req.user?.id });
    await employee.destroy();
    
    res.json({ message: 'Employee archived successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.reactivateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id, { paranoid: false });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    
    await employee.restore();
    await employee.update({ status: 'Active', ModifiedBy: req.user?.id });
    res.json(employee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- Photo Upload ---
exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const employee = await Employee.findByPk(req.params.id, { paranoid: false });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    
    const photoUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    await employee.update({ photoUrl, ModifiedBy: req.user?.id });
    res.json({ photoUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- PDF Profile Export ---
exports.exportEmployeePDF = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id, {
      paranoid: false,
      include: [{ model: EmployeeSalaryAssignment, include: [{ model: SalaryStructure, as: 'structure' }] }]
    });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    
    const company = await Company.findByPk(employee.CompanyId);
    const pdfBuffer = await PDFService.generateEmployeeProfile(employee, company);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=employee_${employee.employeeId}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- CSV Bulk Import ---
exports.importEmployees = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { csvData } = req.body;
    const companyId = req.companyId;
    if (!csvData) return res.status(400).json({ error: 'No CSV data provided' });
    
    const lines = csvData.split(/\r?\n/);
    if (lines.length <= 1) return res.status(400).json({ error: 'Empty or invalid CSV file' });
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = [];
    const errors = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });
      rows.push({ index: i, data: row });
    }
    
    const imported = [];
    for (const r of rows) {
      const d = r.data;
      const firstName = d['First Name'] || d['firstName'];
      const middleName = d['Middle Name'] || d['middleName'] || '';
      const lastName = d['Last Name'] || d['lastName'] || '';
      const email = d['Work Email'] || d['email'];
      const phone = d['Mobile Number'] || d['phone'];
      const dateOfJoining = d['Date of Joining'] || d['dateOfJoining'];
      const dob = d['Date of Birth'] || d['dob'];
      const gender = d['Gender'] || d['gender'];
      const designation = d['Designation'] || d['designation'];
      const department = d['Department'] || d['department'];
      const employmentType = d['Employment Type'] || d['employmentType'] || 'Full Time';
      const bankName = d['Bank Name'] || d['bankName'];
      const bankAccountNumber = d['Account Number'] || d['bankAccountNumber'];
      const bankAccountType = d['Account Type'] || d['bankAccountType'] || 'Savings';
      const ifscCode = d['IFSC Code'] || d['ifscCode'];
      const panNumber = d['PAN Number'] || d['panNumber'];
      const aadhaarNumber = d['Aadhaar Number'] || d['aadhaarNumber'];
      
      const rowNum = r.index;
      
      if (!firstName) {
        errors.push({ row: rowNum, error: 'First Name is required' });
        continue;
      }
      if (!email) {
        errors.push({ row: rowNum, error: 'Work Email is required' });
        continue;
      }
      
      const emailDup = await Employee.count({ where: { workEmail: email }, paranoid: false, transaction });
      if (emailDup > 0) {
        errors.push({ row: rowNum, error: `Email ${email} already exists` });
        continue;
      }
      
      if (panNumber) {
        const panDup = await Employee.count({ where: { panNumber }, paranoid: false, transaction });
        if (panDup > 0) {
          errors.push({ row: rowNum, error: `PAN ${panNumber} already exists` });
          continue;
        }
      }
      if (aadhaarNumber) {
        const aadhaarDup = await Employee.count({ where: { aadhaarNumber }, paranoid: false, transaction });
        if (aadhaarDup > 0) {
          errors.push({ row: rowNum, error: `Aadhaar ${aadhaarNumber} already exists` });
          continue;
        }
      }
      
      const employeeId = d['Employee ID'] || d['employeeId'] || await generateEmployeeCode(companyId);
      const name = `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`.trim();
      
      const emp = await Employee.create({
        employeeId,
        name,
        firstName,
        middleName,
        lastName,
        email,
        phone,
        dateOfJoining: dateOfJoining || null,
        dob: dob || null,
        gender,
        designation,
        department,
        employmentType,
        bankName,
        bankAccountNumber,
        bankAccountType,
        ifscCode,
        panNumber,
        aadhaarNumber,
        CompanyId: companyId,
        CreatedBy: req.user?.id,
        ModifiedBy: req.user?.id
      }, { transaction });
      
      imported.push(emp);
    }
    
    if (errors.length > 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Import validation failed', errors });
    }
    
    await transaction.commit();
    res.json({ success: true, count: imported.length });
  } catch (err) {
    if (transaction) await transaction.rollback();
    res.status(500).json({ error: err.message });
  }
};

// --- CSV Bulk Export ---
exports.exportEmployees = async (req, res) => {
  try {
    const companyId = req.companyId;
    const employees = await Employee.findAll({
      where: { CompanyId: companyId }
    });
    
    const headers = [
      'Employee ID', 'First Name', 'Middle Name', 'Last Name', 'Work Email', 
      'Mobile Number', 'Date of Joining', 'Date of Birth', 'Gender', 
      'Designation', 'Department', 'Employment Type', 'Status', 
      'Bank Name', 'Account Number', 'Account Type', 'IFSC Code', 
      'PAN Number', 'Aadhaar Number'
    ];
    
    let csvString = headers.join(',') + '\n';
    
    employees.forEach(emp => {
      const row = [
        `"${emp.employeeId || ''}"`,
        `"${emp.firstName || ''}"`,
        `"${emp.middleName || ''}"`,
        `"${emp.lastName || ''}"`,
        `"${emp.email || ''}"`,
        `"${emp.phone || ''}"`,
        `"${emp.dateOfJoining || ''}"`,
        `"${emp.dob || ''}"`,
        `"${emp.gender || ''}"`,
        `"${emp.designation || ''}"`,
        `"${emp.department || ''}"`,
        `"${emp.employmentType || ''}"`,
        `"${emp.status || ''}"`,
        `"${emp.bankName || ''}"`,
        `"${emp.bankAccountNumber || ''}"`,
        `"${emp.bankAccountType || ''}"`,
        `"${emp.ifscCode || ''}"`,
        `"${emp.panNumber || ''}"`,
        `"${emp.aadhaarNumber || ''}"`
      ];
      csvString += row.join(',') + '\n';
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=employees_export.csv');
    res.send(csvString);
  } catch (err) {
    next(err);
  }
};

// --- Salary Structure ---


// --- Attendance Log ---
exports.saveAttendance = async (req, res, next) => {
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
    next(err);
  }
};

exports.getAttendanceRange = async (req, res, next) => {
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
    next(err);
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
    const { 
      pfEmployeeRate, pfEmployerRate, pfApplicable, pfRegistrationNumber, pfCap,
      esiEmployeeRate, esiEmployerRate, esiApplicable, esiRegistrationNumber,
      ptMonthlyAmount, standardDeduction, incomeTaxSlabs,
      tanNumber, payrollFrequency, allowanceExemptions
    } = req.body;
    
    let settings = await PayrollSettings.findOne({ where: { CompanyId: companyId } });
    const payload = {
      pfEmployeeRate, pfEmployerRate, pfApplicable, pfRegistrationNumber, pfCap,
      esiEmployeeRate, esiEmployerRate, esiApplicable, esiRegistrationNumber,
      ptMonthlyAmount, standardDeduction, incomeTaxSlabs,
      tanNumber, payrollFrequency, allowanceExemptions,
      CompanyId: companyId
    };
    
    if (!settings) {
      settings = await PayrollSettings.create(payload);
    } else {
      await settings.update(payload);
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.testCalculation = async (req, res) => {
  try {
    const { basic, gross, settings } = req.body;
    
    const basicAmount = parseFloat(basic) || 0;
    const grossAmount = parseFloat(gross) || 0;
    
    let pfDeduction = 0;
    let pfEmployer = 0;
    if (settings.pfApplicable) {
      pfDeduction = Math.round(basicAmount * (parseFloat(settings.pfEmployeeRate) / 100));
      pfEmployer = Math.round(basicAmount * (parseFloat(settings.pfEmployerRate) / 100));
    }
    
    let esiDeduction = 0;
    if (settings.esiApplicable) {
      esiDeduction = Math.round(grossAmount * (parseFloat(settings.esiEmployeeRate) / 100));
    }
    
    const ptDeduction = parseFloat(settings.ptMonthlyAmount) || 0;
    
    // Simple Income Tax Calculation
    const standardDed = parseFloat(settings.standardDeduction) || 50000;
    const annualGross = grossAmount * 12;
    const taxableIncome = Math.max(0, annualGross - standardDed);
    
    let annualTax = 0;
    const slabs = settings.incomeTaxSlabs || [];
    
    for (const slab of slabs) {
      const min = parseFloat(slab.min);
      const max = slab.max ? parseFloat(slab.max) : Infinity;
      const rate = parseFloat(slab.rate) / 100;
      
      if (taxableIncome > min) {
        const taxableAtThisSlab = Math.min(taxableIncome - min, max - min);
        annualTax += taxableAtThisSlab * rate;
      }
    }
    
    const monthlyTax = Math.round(annualTax / 12);
    
    const totalDeductions = pfDeduction + esiDeduction + ptDeduction + monthlyTax;
    const netSalary = grossAmount - totalDeductions;
    
    res.json({
      pfEmployee: pfDeduction,
      pfEmployer: pfEmployer,
      esi: esiDeduction,
      pt: ptDeduction,
      incomeTax: monthlyTax,
      totalDeductions,
      netSalary
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- Payroll Processing Engine ---
exports.processPayroll = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { companyId, month, year, paymentLedgerId, date } = req.body;

    const employees = await Employee.findAll({
      where: { CompanyId: companyId, status: 'Active' },
      include: [{
        model: EmployeeSalaryAssignment,
        where: { isActive: true },
        required: false,
        include: [{
          model: SalaryStructure,
          as: 'structure',
          include: [{
            model: SalaryStructureComponent,
            as: 'components',
            include: [{ model: SalaryComponent, as: 'component' }]
          }]
        }]
      }],
      transaction: t
    });

    if (employees.length === 0) {
      await t.rollback();
      return res.status(400).json({ error: 'No active employees found to process.' });
    }

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

    let totalGrossSalary = 0;
    let totalNetSalary = 0;
    let totalPF = 0;
    let totalESI = 0;
    let totalPT = 0;

    const salarySlips = [];

    const daysInMonth = new Date(year, new Date(`${month} 1, ${year}`).getMonth() + 1, 0).getDate();
    const startDate = `${year}-${String(new Date(`${month} 1, ${year}`).getMonth() + 1).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(new Date(`${month} 1, ${year}`).getMonth() + 1).padStart(2, '0')}-${daysInMonth}`;

    for (const emp of employees) {
      const assignment = emp.EmployeeSalaryAssignments && emp.EmployeeSalaryAssignments[0];
      if (!assignment || !assignment.structure) continue;

      const absentCount = await Attendance.count({
        where: {
          EmployeeId: emp.id,
          status: 'Absent',
          date: { [Op.between]: [startDate, endDate] }
        },
        transaction: t
      });

      const prorationFactor = daysInMonth > 0 ? (daysInMonth - absentCount) / daysInMonth : 1.0;

      const structureComponents = assignment.structure.components || [];
      const breakdown = await SalaryService.calculateSalaryBreakdown(
        Number(assignment.ctcAmount),
        structureComponents,
        assignment.basicAmount ? Number(assignment.basicAmount) : null,
        companyId,
        prorationFactor
      );

      const basic = breakdown.breakdown['BASIC'] || 0;
      const hra = breakdown.breakdown['HRA'] || 0;
      const specialAllowance = breakdown.breakdown['SPECIAL_ALLOWANCE'] || 0;
      const da = breakdown.breakdown['DA'] || 0;

      const pf = breakdown.breakdown['PF_EMP'] || breakdown.breakdown['PF'] || 0;
      const esi = breakdown.breakdown['ESI_EMP'] || breakdown.breakdown['ESI'] || 0;
      const pt = breakdown.breakdown['PT'] || 0;
      const tds = breakdown.breakdown['TDS'] || breakdown.tds || 0;

      const actualGross = breakdown.grossEarnings;
      const actualDeductions = breakdown.totalDeductions + tds;
      const net = breakdown.netPay - tds;

      totalGrossSalary += actualGross;
      totalNetSalary += net;
      totalPF += pf;
      totalESI += esi;
      totalPT += pt;

      const slip = await SalarySlip.create({
        companyId: companyId,
        employeeId: emp.id,
        slipNumber: `SLIP-${emp.id.substring(0,4).toUpperCase()}-${month.substring(0,3).toUpperCase()}-${year}`,
        salaryMonth: startDate,
        salaryYear: parseInt(year),
        basicSalary: basic,
        hra: hra,
        da: da,
        specialAllowance: specialAllowance,
        grossSalary: actualGross,
        pfEmployeeContribution: pf,
        esiEmployeeContribution: esi,
        professionalTax: pt,
        incomeTax: tds,
        totalDeductions: actualDeductions,
        netSalary: net,
        slipStatus: 'Processed',
        createdBy: req.user?.id
      }, { transaction: t });

      salarySlips.push(slip);
    }

    if (totalNetSalary <= 0) {
      await t.rollback();
      return res.status(400).json({ error: 'Gross payroll calculations computed to zero.' });
    }

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

    const voucher = await AccountingService.recordJournalEntry({
      companyId,
      date: date || new Date(),
      voucherType: 'Payment',
      narration: `Salary processed for the month of ${month} ${year}. Total Employees: ${salarySlips.length}`,
      entries: journalEntries,
      userId: req.user?.id
    }, t);

    for (const ps of salarySlips) {
      await ps.update({ journalEntryId: voucher.id, slipStatus: 'PAID' }, { transaction: t });
    }

    await t.commit();
    res.status(201).json({ message: 'Payroll processed and posted successfully', voucher, payslips: salarySlips });
  } catch (err) {
    if (t) await t.rollback();
    console.error('Error processing payroll:', err);
    next(err);
  }
};

exports.getPayslips = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const payslips = await SalarySlip.findAll({
      where: { companyId: companyId },
      include: [{ 
        model: Employee,
        where: { CompanyId: companyId }
      }]
    });
    // Transform fields to match the old frontend response temporarily, or we could update the frontend
    // but looking at PayrollView: slip.basic, slip.hra, slip.Employee.name, slip.Employee.employeeId
    const mapped = payslips.map(s => {
      const data = s.toJSON();
      data.basic = data.basicSalary;
      data.incentives = data.specialAllowance;
      data.pf = data.pfEmployeeContribution;
      data.esi = data.esiEmployeeContribution;
      data.profTax = data.professionalTax;
      data.status = data.slipStatus;
      data.month = new Date(data.salaryMonth).toLocaleString('default', { month: 'long' });
      data.year = data.salaryYear;
      return data;
    });
    res.json(mapped);
  } catch (err) {
    next(err);
  }
};
