/**
 * PAYROLL DRY RUN — Direct DB Simulation
 * This script bypasses HTTP and runs the calculation directly against the DB.
 * Simulates the full 6-step payroll cycle for Raj Kumar (EMP-001)
 */

const COMPANY_ID = '70e1489f-8881-4449-b712-62bdc2a0bf45';

async function run() {
  // Bootstrap models
  const { 
    sequelize, Employee, Attendance, SalaryStructure, EmployeeSalaryAssignment, 
    SalaryStructureComponent, SalaryComponent, SalarySlip, Ledger, PayrollSettings, Company
  } = require('./models');
  const SalaryService = require('./modules/payroll/salary.service');
  const AccountingService = require('./services/AccountingService');
  const { Op } = require('sequelize');

  await sequelize.authenticate();

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║     PAYROLL DRY RUN — FULL 6-STEP CYCLE SIMULATION      ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // ── STEP 1: Statutory Configuration ──────────────────────────────
  console.log('─── STEP 1: Statutory Settings (PayrollSettings) ────────');
  const settings = await PayrollSettings.findOne({ where: { CompanyId: COMPANY_ID }});
  if (!settings) { console.log('❌ No PayrollSettings found!'); return; }
  console.log(`   PF Employee Rate:  ${settings.pfEmployeeRate}%`);
  console.log(`   PF Cap:            ₹${settings.pfCap}`);
  console.log(`   ESI Threshold:     ₹${settings.esiThreshold}`);
  console.log(`   PT Monthly:        ₹${settings.ptMonthlyAmount}`);

  // ── STEP 2: Employee Onboarding ───────────────────────────────────
  console.log('\n─── STEP 2: Employee Onboarding ─────────────────────────');
  const emp = await Employee.findOne({
    where: { CompanyId: COMPANY_ID },
    include: [{
      model: EmployeeSalaryAssignment,
      where: { isActive: true },
      required: false,
      include: [{
        model: SalaryStructure,
        as: 'structure',
        include: [{ model: SalaryStructureComponent, as: 'components', include: [{ model: SalaryComponent, as: 'component' }] }]
      }]
    }]
  });

  if (!emp) { console.log('❌ No employees found!'); return; }
  console.log(`   Employee:     ${emp.name} (${emp.employeeId})`);
  console.log(`   Department:   ${emp.department}`);
  console.log(`   Designation:  ${emp.designation}`);
  console.log(`   Status:       ${emp.status}`);

  // ── STEP 3: Salary Structure ──────────────────────────────────────
  console.log('\n─── STEP 3: Salary Structure Assignment ─────────────────');
  const assignment = emp.EmployeeSalaryAssignments && emp.EmployeeSalaryAssignments[0];
  if (!assignment) { console.log('❌ No salary assignment found!'); return; }
  const annualCtc = Number(assignment.ctcAmount);
  const monthlyCtc = annualCtc / 12;
  console.log(`   Structure:    ${assignment.structure?.name}`);
  console.log(`   Annual CTC:   ₹${annualCtc.toLocaleString('en-IN')}`);
  console.log(`   Monthly CTC:  ₹${monthlyCtc.toFixed(2)}`);
  const components = assignment.structure?.components || [];
  console.log(`   Components:   ${components.map(c => c.component?.code).join(', ')}`);

  // ── STEP 4: Attendance ────────────────────────────────────────────
  console.log('\n─── STEP 4: Attendance (June 2026) ──────────────────────');
  const year = '2026';
  const month = 'June';
  const monthIndex = new Date(`${month} 1, ${year}`).getMonth() + 1;
  const daysInMonth = new Date(year, monthIndex, 0).getDate();
  const startDate = `${year}-${String(monthIndex).padStart(2, '0')}-01`;
  const endDate   = `${year}-${String(monthIndex).padStart(2, '0')}-${daysInMonth}`;

  const absentCount = await Attendance.count({
    where: { 
      EmployeeId: emp.id,
      Status: 'Absent',
      AttendanceDate: { [Op.between]: [startDate, endDate] }
    }
  });
  const presentDays = daysInMonth - absentCount;
  const prorationFactor = daysInMonth > 0 ? presentDays / daysInMonth : 1.0;

  console.log(`   Month:           ${month} ${year}`);
  console.log(`   Days in Month:   ${daysInMonth}`);
  console.log(`   Days Absent:     ${absentCount}`);
  console.log(`   Days Present:    ${presentDays}`);
  console.log(`   Proration:       ${presentDays}/${daysInMonth} = ${(prorationFactor * 100).toFixed(2)}%`);

  // ── STEP 5: Salary Calculation ────────────────────────────────────
  console.log('\n─── STEP 5: Salary Calculation ──────────────────────────');
  const structureComponents = components;
  const basicOverride = assignment.basicAmount ? Number(assignment.basicAmount) : 300000; // 25k/month as per workflow guide
  
  const breakdown = await SalaryService.calculateSalaryBreakdown(
    annualCtc, structureComponents, basicOverride, COMPANY_ID, prorationFactor
  );

  const gross = breakdown.grossEarnings;
  const basic = breakdown.breakdown['BASIC'] || 0;
  const hra   = breakdown.breakdown['HRA'] || 0;
  const da    = breakdown.breakdown['DA'] || 0;
  const special = breakdown.breakdown['SPECIAL_ALLOWANCE'] || 0;
  const pf    = breakdown.breakdown['PF'] || breakdown.breakdown['PF_EMP'] || 0;
  const esi   = breakdown.breakdown['ESI_EMP'] || 0;
  const pt    = breakdown.breakdown['PT'] || 0;
  const tds   = breakdown.breakdown['TDS'] || breakdown.tds || 0;
  const totalDeductions = breakdown.totalDeductions;
  const net   = isNaN(breakdown.netPay) ? (gross - totalDeductions) : breakdown.netPay;

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                  PAYSLIP BREAKDOWN                      ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  EARNINGS                                                ║`);
  console.log(`║    Basic Salary:         ₹${String(basic.toFixed(2)).padStart(12)}                  ║`);
  console.log(`║    HRA (50% of Basic):   ₹${String(hra.toFixed(2)).padStart(12)}                  ║`);
  console.log(`║    DA:                   ₹${String(da.toFixed(2)).padStart(12)}                  ║`);
  console.log(`║    Special Allowance:    ₹${String(special.toFixed(2)).padStart(12)}                  ║`);
  console.log('║  ──────────────────────────────────────────────────────  ║');
  console.log(`║  GROSS SALARY:           ₹${String(gross.toFixed(2)).padStart(12)}                  ║`);
  console.log('║                                                          ║');
  console.log(`║  DEDUCTIONS                                              ║`);
  console.log(`║    PF (Provident Fund):  ₹${String(pf.toFixed(2)).padStart(12)}                  ║`);
  console.log(`║    ESI:                  ₹${String(esi.toFixed(2)).padStart(12)}                  ║`);
  console.log(`║    Professional Tax:     ₹${String(pt.toFixed(2)).padStart(12)}                  ║`);
  console.log(`║    Income Tax (TDS):     ₹${String(tds.toFixed(2)).padStart(12)}                  ║`);
  console.log('║  ──────────────────────────────────────────────────────  ║');
  console.log(`║  TOTAL DEDUCTIONS:       ₹${String(totalDeductions.toFixed(2)).padStart(12)}                  ║`);
  console.log('║                                                          ║');
  console.log(`║  ★ NET SALARY:           ₹${String(net.toFixed(2)).padStart(12)}                  ║`);
  console.log('╚══════════════════════════════════════════════════════════╝');

  // Journal Entry Balance Check
  console.log('\n─── JOURNAL ENTRY BALANCE CHECK ─────────────────────────');
  const totalCr = Number((net + pf + esi + pt + tds).toFixed(2));
  console.log(`   Dr. Salaries Expense:  ₹${gross.toFixed(2)}`);
  console.log(`   Cr. Bank/Cash:         ₹${net.toFixed(2)}`);
  console.log(`   Cr. PF Payable:        ₹${pf.toFixed(2)}`);
  console.log(`   Cr. ESI Payable:       ₹${esi.toFixed(2)}`);
  console.log(`   Cr. PT Payable:        ₹${pt.toFixed(2)}`);
  console.log(`   Cr. TDS Payable:       ₹${tds.toFixed(2)}`);
  console.log(`   ─────────────────────────────────────`);
  console.log(`   Total Credits:         ₹${totalCr.toFixed(2)}`);
  console.log(`   BALANCED? ${gross.toFixed(2) === totalCr.toFixed(2) ? '✅ YES' : '❌ NO'}`);

  console.log('\n─── LOP FORMULA BREAKDOWN ───────────────────────────────');
  console.log(`   Salary/Day = ₹${monthlyCtc.toFixed(2)} ÷ ${daysInMonth} = ₹${(monthlyCtc/daysInMonth).toFixed(2)}/day`);
  console.log(`   LOP Deduction = ₹${(monthlyCtc/daysInMonth).toFixed(2)} × ${absentCount} days = ₹${(monthlyCtc/daysInMonth * absentCount).toFixed(2)}`);
  console.log(`   Payable = ₹${monthlyCtc.toFixed(2)} − ₹${(monthlyCtc/daysInMonth * absentCount).toFixed(2)} = ₹${gross.toFixed(2)}`);

  console.log('\n✅ DRY RUN COMPLETE!\n');
  process.exit(0);
}

run().catch(err => {
  console.error('Fatal error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
