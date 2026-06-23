const SalaryService = require('../salary.service');

describe('SalaryService.calculateSalaryBreakdown', () => {
  const mockComponents = [
    {
      component: { code: 'BASIC', type: 'Earning', calculationType: 'Fixed', calculationValue: 25000, displayOrder: 1 }
    },
    {
      component: { code: 'HRA', type: 'Earning', calculationType: 'Percentage', calculationBase: 'BASIC', calculationValue: 50, displayOrder: 2 }
    },
    {
      component: { code: 'SPECIAL_ALLOWANCE', type: 'Earning', calculationType: 'Balancing', calculationBase: 'RemainingGross', displayOrder: 3 }
    },
    {
      component: { code: 'PF', type: 'Deduction', calculationType: 'Percentage', calculationBase: 'BASIC', calculationValue: 12, displayOrder: 4 }
    },
    {
      component: { code: 'ESI_EMP', type: 'Deduction', calculationType: 'Percentage', calculationBase: 'GROSS', calculationValue: 0.75, displayOrder: 5 }
    },
    {
      component: { code: 'PT', type: 'Deduction', calculationType: 'Fixed', calculationValue: 200, displayOrder: 6 }
    }
  ];

  // TEST 1: CTC → Net Pay
  test('should compute net pay from annual CTC', async () => {
    const breakdown = await SalaryService.calculateSalaryBreakdown(600000, mockComponents);
    expect(breakdown.grossEarnings).toBe(50000); // 600000 / 12
    // Basic: 25000
    // HRA: 12500
    // Special: 12500
    // PF: 1800 (12% of 25000 = 3000, capped at 1800)
    // ESI: 0 (Gross is 50000 > 21000)
    // PT: 200 (Gross > 15000)
    // Total Deductions = 1800 + 0 + 200 = 2000
    // Net Pay = 50000 - 2000 = 48000
    expect(breakdown.netPay).toBeCloseTo(48000, 0);
  });

  // TEST 2: PF Cap at ₹1,800
  test('should cap PF at ₹1,800 even if 12% basic exceeds it', async () => {
    const breakdown = await SalaryService.calculateSalaryBreakdown(600000, mockComponents);
    expect(breakdown.breakdown['PF']).toBe(1800);
  });

  // TEST 3: ESI Only if gross <= ₹21,000
  test('should NOT deduct ESI if gross > ₹21,000', async () => {
    const breakdown = await SalaryService.calculateSalaryBreakdown(600000, mockComponents);
    expect(breakdown.breakdown['ESI_EMP']).toBe(0);
  });
  
  test('should deduct ESI if gross <= ₹21,000', async () => {
    // 21000 * 12 = 252000, basicOverride = 14000 * 12
    const breakdown = await SalaryService.calculateSalaryBreakdown(252000, mockComponents, 14000 * 12);
    expect(breakdown.grossEarnings).toBe(21000);
    expect(breakdown.breakdown['ESI_EMP']).toBeCloseTo(157.5, 1); // 0.75% of 21000
  });

  // TEST 4: PT Slabs
  test('should apply PT ₹200 if gross >= ₹15,000', async () => {
    const breakdown = await SalaryService.calculateSalaryBreakdown(300000, mockComponents); // 25k/month
    expect(breakdown.breakdown['PT']).toBe(200);
  });
  
  test('should apply PT ₹150 if gross is between 10k and 15k', async () => {
    // 12k/month => basic 8000
    const breakdown = await SalaryService.calculateSalaryBreakdown(144000, mockComponents, 8000 * 12); 
    expect(breakdown.breakdown['PT']).toBe(150);
  });

  // TEST 5: Voucher Balance
  test('should balance the journal voucher', async () => {
    const breakdown = await SalaryService.calculateSalaryBreakdown(600000, mockComponents);
    const debitSalary = breakdown.grossEarnings;
    const creditSum = breakdown.netPay + (breakdown.breakdown['PF'] || 0) + (breakdown.breakdown['ESI_EMP'] || 0) + (breakdown.breakdown['PT'] || 0) + (breakdown.tds || 0);
    expect(debitSalary).toBeCloseTo(creditSum, 1);
  });

  // TEST 6: Determinism
  test('should always return same output for same input', async () => {
    const result1 = await SalaryService.calculateSalaryBreakdown(600000, mockComponents);
    const result2 = await SalaryService.calculateSalaryBreakdown(600000, mockComponents);
    expect(result1).toEqual(result2);
  });
});
