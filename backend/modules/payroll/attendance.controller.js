const { Attendance, Employee, User, Company, sequelize } = require('../../models');
const { Op } = require('sequelize');

const VALID_STATUSES = [
  'Present', 'Absent', 'Half-Day', 'Leave',
  'Sick-Leave', 'Casual-Leave', 'Earned-Leave',
  'Comp-Off', 'Holiday'
];

// ─── Helper: calculate working hours from times ───────────────
const calcWorkingHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return null;
  try {
    const [inH, inM] = checkIn.split(':').map(Number);
    const [outH, outM] = checkOut.split(':').map(Number);
    const totalMins = (outH * 60 + outM) - (inH * 60 + inM);
    if (totalMins <= 0) return null;
    return parseFloat((totalMins / 60).toFixed(2));
  } catch {
    return null;
  }
};

// ─── Helper: employee include options ─────────────────────────
const empInclude = () => ({
  model: Employee,
  attributes: ['id', 'employeeId', 'name', 'department', 'designation', 'photoUrl']
});

// ─── Helper: approved-by user include ─────────────────────────
const approvedByInclude = () => ({
  model: User,
  as: 'ApprovedByUser',
  attributes: ['id', 'name', 'email'],
  required: false
});

// ─── Helper: created-by user include ──────────────────────────
const createdByInclude = () => ({
  model: User,
  as: 'CreatedByUser',
  attributes: ['id', 'name', 'email'],
  required: false
});

// ═══════════════════════════════════════════════════════════════
// GET /api/attendances
// Query: companyId, employeeId, fromDate, toDate, status, page, limit
// ═══════════════════════════════════════════════════════════════
exports.getAll = async (req, res) => {
  try {
    const companyId = req.companyId || req.query.companyId;
    if (!companyId) return res.status(400).json({ error: 'companyId is required' });

    const {
      employeeId, fromDate, toDate, status,
      page = 1, limit = 10, sortBy = 'AttendanceDate', sortDir = 'DESC',
      pendingApproval, department, search
    } = req.query;

    const where = { CompanyId: companyId };
    if (employeeId) where.EmployeeId = employeeId;
    if (status) where.Status = status;
    if (pendingApproval === 'true') where.IsApproved = false;
    if (fromDate || toDate) {
      where.AttendanceDate = {};
      if (fromDate) where.AttendanceDate[Op.gte] = fromDate;
      if (toDate) where.AttendanceDate[Op.lte] = toDate;
    }

    const empWhere = {};
    if (department) empWhere.department = department;
    if (search) {
      empWhere[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { employeeId: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const offset = (pageNum - 1) * limitNum;

    const allowedSortFields = ['AttendanceDate', 'Status', 'WorkingHours', 'createdAt'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'AttendanceDate';
    const orderDir = sortDir === 'ASC' ? 'ASC' : 'DESC';

    const { count, rows } = await Attendance.findAndCountAll({
      where,
      include: [
        { ...empInclude(), where: Object.keys(empWhere).length ? empWhere : undefined },
        approvedByInclude(),
        createdByInclude()
      ],
      order: [[orderField, orderDir]],
      limit: limitNum,
      offset,
      distinct: true
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        pages: Math.ceil(count / limitNum)
      }
    });
  } catch (err) {
    console.error('[Attendance.getAll]', err);
    res.status(500).json({ error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// GET /api/attendances/:id
// ═══════════════════════════════════════════════════════════════
exports.getById = async (req, res) => {
  try {
    const companyId = req.companyId;
    const record = await Attendance.findOne({
      where: { id: req.params.id, CompanyId: companyId },
      include: [empInclude(), approvedByInclude(), createdByInclude()]
    });
    if (!record) return res.status(404).json({ error: 'Attendance record not found' });
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// POST /api/attendances  — Mark attendance
// ═══════════════════════════════════════════════════════════════
exports.create = async (req, res) => {
  try {
    const companyId = req.companyId;
    const {
      employeeId, attendanceDate, status, leaveType,
      checkInTime, checkOutTime, workingHours,
      notes, latitude, longitude
    } = req.body;

    // Required field checks
    if (!employeeId) return res.status(400).json({ error: 'employeeId is required' });
    if (!attendanceDate) return res.status(400).json({ error: 'attendanceDate is required' });
    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    // Date must not be in the future
    const today = new Date().toISOString().split('T')[0];
    if (attendanceDate > today) {
      return res.status(400).json({ error: 'Attendance date cannot be in the future' });
    }

    // Check employee belongs to this company
    const employee = await Employee.findOne({ where: { id: employeeId, CompanyId: companyId } });
    if (!employee) return res.status(404).json({ error: 'Employee not found in this company' });

    // Check duplicate
    const existing = await Attendance.findOne({
      where: { CompanyId: companyId, EmployeeId: employeeId, AttendanceDate: attendanceDate }
    });
    if (existing) {
      return res.status(409).json({
        error: `Attendance already marked for ${employee.name} on ${attendanceDate}`
      });
    }

    // Time validation
    if (checkInTime && checkOutTime) {
      const hours = calcWorkingHours(checkInTime, checkOutTime);
      if (hours === null) {
        return res.status(400).json({ error: 'Check-out time must be after check-in time' });
      }
    }

    // Auto-calculate working hours if not provided
    let finalWorkingHours = workingHours;
    if (!finalWorkingHours && checkInTime && checkOutTime) {
      finalWorkingHours = calcWorkingHours(checkInTime, checkOutTime);
    }

    const record = await Attendance.create({
      CompanyId: companyId,
      EmployeeId: employeeId,
      AttendanceDate: attendanceDate,
      Status: status,
      LeaveType: leaveType || null,
      CheckInTime: checkInTime || null,
      CheckOutTime: checkOutTime || null,
      WorkingHours: finalWorkingHours || null,
      Notes: notes || null,
      Latitude: latitude || null,
      Longitude: longitude || null,
      CreatedBy: req.user?.id || null,
      UpdatedBy: req.user?.id || null
    });

    const full = await Attendance.findOne({
      where: { id: record.id },
      include: [empInclude(), approvedByInclude(), createdByInclude()]
    });

    res.status(201).json({ success: true, message: 'Attendance marked successfully', data: full });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Attendance already marked for this employee on this date' });
    }
    console.error('[Attendance.create]', err);
    res.status(500).json({ error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// PUT /api/attendances/:id  — Update attendance
// ═══════════════════════════════════════════════════════════════
exports.update = async (req, res) => {
  try {
    const companyId = req.companyId;
    const record = await Attendance.findOne({
      where: { id: req.params.id, CompanyId: companyId }
    });
    if (!record) return res.status(404).json({ error: 'Attendance record not found' });

    // Cannot edit approved records
    if (record.IsApproved) {
      return res.status(403).json({ error: 'Cannot edit an approved attendance record' });
    }

    const {
      status, leaveType, checkInTime, checkOutTime,
      workingHours, notes, latitude, longitude
    } = req.body;

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    // Auto-calculate working hours if times changed
    let finalWorkingHours = workingHours;
    const inTime = checkInTime !== undefined ? checkInTime : record.CheckInTime;
    const outTime = checkOutTime !== undefined ? checkOutTime : record.CheckOutTime;
    if (!finalWorkingHours && inTime && outTime) {
      finalWorkingHours = calcWorkingHours(inTime, outTime);
    }

    await record.update({
      ...(status && { Status: status }),
      ...(leaveType !== undefined && { LeaveType: leaveType }),
      ...(checkInTime !== undefined && { CheckInTime: checkInTime }),
      ...(checkOutTime !== undefined && { CheckOutTime: checkOutTime }),
      ...(finalWorkingHours !== undefined && { WorkingHours: finalWorkingHours }),
      ...(notes !== undefined && { Notes: notes }),
      ...(latitude !== undefined && { Latitude: latitude }),
      ...(longitude !== undefined && { Longitude: longitude }),
      UpdatedBy: req.user?.id || null
    });

    const updated = await Attendance.findOne({
      where: { id: record.id },
      include: [empInclude(), approvedByInclude(), createdByInclude()]
    });

    res.json({ success: true, message: 'Attendance updated successfully', data: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// DELETE /api/attendances/:id
// ═══════════════════════════════════════════════════════════════
exports.remove = async (req, res) => {
  try {
    const companyId = req.companyId;
    const record = await Attendance.findOne({
      where: { id: req.params.id, CompanyId: companyId }
    });
    if (!record) return res.status(404).json({ error: 'Attendance record not found' });

    if (record.IsApproved) {
      return res.status(403).json({ error: 'Cannot delete an approved attendance record' });
    }

    await record.destroy();
    res.json({ success: true, message: 'Attendance record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// GET /api/attendances/summary/monthly
// Query: companyId, employeeId, month (YYYY-MM)
// ═══════════════════════════════════════════════════════════════
exports.getMonthlySummary = async (req, res) => {
  try {
    const companyId = req.companyId || req.query.companyId;
    if (!companyId) return res.status(400).json({ error: 'companyId is required' });

    const { employeeId, month } = req.query;
    const targetMonth = month || new Date().toISOString().slice(0, 7); // 'YYYY-MM'
    const [year, mon] = targetMonth.split('-').map(Number);
    const fromDate = `${targetMonth}-01`;
    const lastDay = new Date(year, mon, 0).getDate();
    const toDate = `${targetMonth}-${String(lastDay).padStart(2, '0')}`;

    const where = {
      CompanyId: companyId,
      AttendanceDate: { [Op.between]: [fromDate, toDate] }
    };
    if (employeeId) where.EmployeeId = employeeId;

    const records = await Attendance.findAll({
      where,
      include: [empInclude()]
    });

    // Group by employee
    const summaryMap = {};
    for (const r of records) {
      const eid = r.EmployeeId;
      if (!summaryMap[eid]) {
        summaryMap[eid] = {
          employeeId: eid,
          employeeName: r.Employee?.name || 'Unknown',
          employeeCode: r.Employee?.employeeId || '',
          department: r.Employee?.department || '',
          designation: r.Employee?.designation || '',
          month: targetMonth,
          presentDays: 0,
          absentDays: 0,
          halfDays: 0,
          sickLeaveDays: 0,
          casualLeaveDays: 0,
          earnedLeaveDays: 0,
          compOffDays: 0,
          holidayDays: 0,
          leaveDays: 0,
          totalMarked: 0
        };
      }
      const s = summaryMap[eid];
      s.totalMarked++;
      switch (r.Status) {
        case 'Present': s.presentDays++; break;
        case 'Absent': s.absentDays++; break;
        case 'Half-Day': s.halfDays++; break;
        case 'Sick-Leave': s.sickLeaveDays++; break;
        case 'Casual-Leave': s.casualLeaveDays++; break;
        case 'Earned-Leave': s.earnedLeaveDays++; break;
        case 'Comp-Off': s.compOffDays++; break;
        case 'Holiday': s.holidayDays++; break;
        case 'Leave': s.leaveDays++; break;
      }
    }

    // Calculate total working days (Mon-Fri in the month)
    const workingDays = (() => {
      let count = 0;
      const d = new Date(fromDate);
      while (d <= new Date(toDate)) {
        const day = d.getDay();
        if (day !== 0 && day !== 6) count++;
        d.setDate(d.getDate() + 1);
      }
      return count;
    })();

    const summary = Object.values(summaryMap).map(s => ({
      ...s,
      totalWorkingDays: workingDays,
      attendancePercentage: workingDays > 0
        ? parseFloat(((s.presentDays + s.halfDays * 0.5) / workingDays * 100).toFixed(2))
        : 0
    }));

    res.json({ success: true, data: summary, month: targetMonth, workingDays });
  } catch (err) {
    console.error('[Attendance.getMonthlySummary]', err);
    res.status(500).json({ error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// PUT /api/attendances/:id/approve  — Approve/Reject
// ═══════════════════════════════════════════════════════════════
exports.approve = async (req, res) => {
  try {
    const companyId = req.companyId;
    const record = await Attendance.findOne({
      where: { id: req.params.id, CompanyId: companyId }
    });
    if (!record) return res.status(404).json({ error: 'Attendance record not found' });

    const { isApproved } = req.body;

    await record.update({
      IsApproved: isApproved === true,
      ApprovedBy: isApproved ? req.user?.id : null,
      ApprovedDate: isApproved ? new Date() : null
    });

    const updated = await Attendance.findOne({
      where: { id: record.id },
      include: [empInclude(), approvedByInclude(), createdByInclude()]
    });

    const msg = isApproved ? 'Attendance approved successfully' : 'Attendance approval revoked';
    res.json({ success: true, message: msg, data: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// POST /api/attendances/bulk-import  — Bulk import from CSV data
// ═══════════════════════════════════════════════════════════════
exports.bulkImport = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { records } = req.body; // array of attendance objects

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'records array is required and must not be empty' });
    }

    // Load all employees for lookup
    const employees = await Employee.findAll({
      where: { CompanyId: companyId },
      attributes: ['id', 'employeeId', 'name']
    });
    const empByCode = {};
    for (const e of employees) empByCode[e.employeeId.toLowerCase()] = e;

    const created = [];
    const errors = [];

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 1;

      try {
        const empCode = (row.employeeId || row.employee_id || '').toString().trim().toLowerCase();
        const employee = empByCode[empCode];
        if (!employee) {
          errors.push({ row: rowNum, error: `Employee ID "${empCode}" not found` });
          continue;
        }

        const status = row.status || row.Status;
        if (!status || !VALID_STATUSES.includes(status)) {
          errors.push({ row: rowNum, error: `Invalid status: "${status}"` });
          continue;
        }

        const attendanceDate = row.date || row.attendanceDate || row.attendance_date;
        if (!attendanceDate) {
          errors.push({ row: rowNum, error: 'date is required' });
          continue;
        }

        // Check duplicate
        const dup = await Attendance.findOne({
          where: { CompanyId: companyId, EmployeeId: employee.id, AttendanceDate: attendanceDate }
        });
        if (dup) {
          errors.push({ row: rowNum, error: `Duplicate: ${employee.name} on ${attendanceDate}` });
          continue;
        }

        const record = await Attendance.create({
          CompanyId: companyId,
          EmployeeId: employee.id,
          AttendanceDate: attendanceDate,
          Status: status,
          LeaveType: row.leaveType || row.leave_type || null,
          Notes: row.notes || null,
          WorkingHours: row.workingHours || row.working_hours || null,
          CheckInTime: row.checkInTime || row.check_in || null,
          CheckOutTime: row.checkOutTime || row.check_out || null,
          CreatedBy: req.user?.id || null,
          UpdatedBy: req.user?.id || null
        });

        created.push(record.id);
      } catch (rowErr) {
        errors.push({ row: rowNum, error: rowErr.message });
      }
    }

    res.status(201).json({
      success: true,
      message: `Successfully imported ${created.length} records`,
      imported: created.length,
      failed: errors.length,
      errors
    });
  } catch (err) {
    console.error('[Attendance.bulkImport]', err);
    res.status(500).json({ error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// GET /api/attendances/export  — Export as CSV
// ═══════════════════════════════════════════════════════════════
exports.exportCSV = async (req, res) => {
  try {
    const companyId = req.companyId || req.query.companyId;
    const { fromDate, toDate, employeeId, status } = req.query;

    const where = { CompanyId: companyId };
    if (employeeId) where.EmployeeId = employeeId;
    if (status) where.Status = status;
    if (fromDate || toDate) {
      where.AttendanceDate = {};
      if (fromDate) where.AttendanceDate[Op.gte] = fromDate;
      if (toDate) where.AttendanceDate[Op.lte] = toDate;
    }

    const records = await Attendance.findAll({
      where,
      include: [empInclude()],
      order: [['AttendanceDate', 'DESC']]
    });

    const headers = [
      'Employee ID', 'Employee Name', 'Department', 'Designation',
      'Date', 'Status', 'Leave Type', 'Check In', 'Check Out',
      'Working Hours', 'Notes', 'Approved'
    ];

    const rows = records.map(r => [
      r.Employee?.employeeId || '',
      r.Employee?.name || '',
      r.Employee?.department || '',
      r.Employee?.designation || '',
      r.AttendanceDate,
      r.Status,
      r.LeaveType || '',
      r.CheckInTime || '',
      r.CheckOutTime || '',
      r.WorkingHours || '',
      (r.Notes || '').replace(/,/g, ';'),
      r.IsApproved ? 'Yes' : 'No'
    ]);

    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance_export.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// (Legacy compat) GET /api/payroll/attendance/:companyId
// Used by old PayrollView.jsx to load attendance logs
// ═══════════════════════════════════════════════════════════════
exports.getLegacy = async (req, res) => {
  try {
    const companyId = req.params.companyId || req.companyId;
    const records = await Attendance.findAll({
      where: { CompanyId: companyId },
      include: [empInclude()],
      order: [['AttendanceDate', 'DESC']],
      limit: 100
    });
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// (Legacy compat) POST /api/payroll/attendance
// ═══════════════════════════════════════════════════════════════
exports.saveLegacy = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { employeeId, date, status, remarks } = req.body;

    if (!employeeId || !date) {
      return res.status(400).json({ error: 'employeeId and date are required' });
    }

    const today = new Date().toISOString().split('T')[0];
    if (date > today) return res.status(400).json({ error: 'Date cannot be in the future' });

    // upsert for legacy compat
    const [record, created] = await Attendance.findOrCreate({
      where: { CompanyId: companyId, EmployeeId: employeeId, AttendanceDate: date },
      defaults: {
        Status: status || 'Present',
        Notes: remarks || null,
        CreatedBy: req.user?.id || null,
        UpdatedBy: req.user?.id || null
      }
    });

    if (!created) {
      await record.update({
        Status: status || record.Status,
        Notes: remarks !== undefined ? remarks : record.Notes,
        UpdatedBy: req.user?.id || null
      });
    }

    res.status(created ? 201 : 200).json({
      success: true,
      message: created ? 'Attendance logged' : 'Attendance updated',
      data: record
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
