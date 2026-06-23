const SalaryService = require('./modules/payroll/salary.service');

async function runSimulation() {
  console.log("=========================================================");
  console.log("   PAYROLL SIMULATION: 6-STEP CYCLE & LOP PRO-RATION     ");
  console.log("=========================================================\n");

  const annualCtc = 600000;
  const basicOverride = 300000; // 25,000 per month

  const mockComponents = [
    { component: { id: 1, name: 'Basic', code: 'BASIC', type: 'Earning', calculationType: 'Fixed', calculationValue: 0, isStatutory: false, displayOrder: 1 } },
    { component: { id: 2, name: 'HRA', code: 'HRA', type: 'Earning', calculationType: 'Percentage', calculationBase: 'BASIC', calculationValue: 50, isStatutory: false, displayOrder: 2 } },
    { component: { id: 3, name: 'Special Allowance', code: 'SPECIAL_ALLOWANCE', type: 'Earning', calculationType: 'Fixed', calculationBase: 'RemainingGross', calculationValue: 0, isStatutory: false, displayOrder: 3 } },
    { component: { id: 4, name: 'Provident Fund', code: 'PF', type: 'Deduction', calculationType: 'Percentage', calculationBase: 'BASIC', calculationValue: 12, isStatutory: true, displayOrder: 1 } },
    { component: { id: 5, name: 'ESI', code: 'ESI_EMP', type: 'Deduction', calculationType: 'Percentage', calculationBase: 'GROSS', calculationValue: 0.75, isStatutory: true, displayOrder: 2 } },
    { component: { id: 6, name: 'Professional Tax', code: 'PT', type: 'Deduction', calculationType: 'Fixed', calculationValue: 200, isStatutory: true, displayOrder: 3 } },
    // Fake TDS component to match the visual guide exactly
    { component: { id: 7, name: 'Income Tax (TDS)', code: 'TDS', type: 'Deduction', calculationType: 'Fixed', calculationValue: 1250, isStatutory: true, displayOrder: 4 } }
  ];

  // Case A: Full Month
  console.log("---------------------------------------------------------");
  console.log(" SCENARIO 1: FULL MONTH (No leaves)");
  console.log("---------------------------------------------------------");
  const fullMonth = await SalaryService.calculateSalaryBreakdown(annualCtc, mockComponents, basicOverride, null, 1.0);
  
  console.log(`Gross Earnings: ₹${fullMonth.grossEarnings}`);
  console.log(`  Basic: ₹${fullMonth.breakdown['BASIC']}`);
  console.log(`  HRA: ₹${fullMonth.breakdown['HRA']}`);
  console.log(`  Special Allowance: ₹${fullMonth.breakdown['SPECIAL_ALLOWANCE']}`);
  console.log(`Deductions: ₹${fullMonth.totalDeductions}`);
  console.log(`  PF: ₹${fullMonth.breakdown['PF']}`);
  console.log(`  ESI: ₹${fullMonth.breakdown['ESI_EMP']}`);
  console.log(`  PT: ₹${fullMonth.breakdown['PT']}`);
  console.log(`  TDS: ₹${fullMonth.breakdown['TDS']}`);
  console.log(`NET PAY: ₹${fullMonth.netPay}\n`);


  // Case B: 5 Days LOP (in Jan = 31 days)
  console.log("---------------------------------------------------------");
  console.log(" SCENARIO 2: 5 DAYS LOP (e.g. 5 days absent in January)");
  console.log(" Days in Month = 31, Present = 26, Proration Factor = 26/31");
  console.log("---------------------------------------------------------");
  const daysInMonth = 31;
  const lopDays = 5;
  const prorationFactor = (daysInMonth - lopDays) / daysInMonth;
  
  const lopMonth = await SalaryService.calculateSalaryBreakdown(annualCtc, mockComponents, basicOverride, null, prorationFactor);
  
  console.log(`Gross Earnings: ₹${lopMonth.grossEarnings}`);
  console.log(`  Basic: ₹${lopMonth.breakdown['BASIC']}`);
  console.log(`  HRA: ₹${lopMonth.breakdown['HRA']}`);
  console.log(`  Special Allowance: ₹${lopMonth.breakdown['SPECIAL_ALLOWANCE']}`);
  console.log(`Deductions: ₹${lopMonth.totalDeductions}`);
  console.log(`  PF: ₹${lopMonth.breakdown['PF']}`);
  console.log(`  ESI: ₹${lopMonth.breakdown['ESI_EMP']}`);
  console.log(`  PT: ₹${lopMonth.breakdown['PT']}`);
  console.log(`  TDS: ₹${lopMonth.breakdown['TDS']}`);
  console.log(`NET PAY: ₹${lopMonth.netPay}\n`);


  // Journal Entry balancing verification
  console.log("---------------------------------------------------------");
  console.log(" JOURNAL ENTRY VERIFICATION (Scenario 2 LOP)");
  console.log("---------------------------------------------------------");
  const drSalaries = lopMonth.grossEarnings;
  const crBank = lopMonth.netPay;
  const crPF = lopMonth.breakdown['PF'];
  const crESI = lopMonth.breakdown['ESI_EMP'];
  const crPT = lopMonth.breakdown['PT'];
  const crTDS = lopMonth.breakdown['TDS'];

  const totalCr = Number((crBank + crPF + crESI + crPT + crTDS).toFixed(2));
  
  console.log(`Debit (Salaries & Wages Expense): ₹${drSalaries}`);
  console.log(`Credit (Total Liabilities & Bank): ₹${totalCr}`);
  console.log(`BALANCED? ${drSalaries === totalCr ? 'YES ✓' : 'NO ❌'}`);
  console.log("=========================================================\n");
  
  process.exit(0);
}

runSimulation().catch(console.error);
