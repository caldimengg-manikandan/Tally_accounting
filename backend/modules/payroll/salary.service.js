const { 
  SalaryComponent, 
  SalaryStructure, 
  SalaryStructureComponent, 
  EmployeeSalaryAssignment,
  Employee
} = require('../../models');

/**
 * Core Salary Calculation Engine for Indian Payroll
 */
class SalaryService {
  /**
   * Calculates monthly salary breakdown based on annual CTC and assigned structure
   * @param {number} annualCtc - The employee's annual CTC
   * @param {Array} structureComponents - List of components assigned to the structure (with potential overrides)
   * @param {number} [basicOverride] - Optional annual basic salary override
   * @param {string} [companyId] - Optional company ID for settings
   * @param {number} [prorationFactor] - Fraction of month worked (0 to 1)
   */
  static async calculateSalaryBreakdown(annualCtc, structureComponents, basicOverride = null, companyId = null, prorationFactor = 1.0) {
    let pfCap = 1800;
    let esiThreshold = 21000;
    let ptAmount = 200;
    let pfEmployerRate = 12;
    let pfEmployeeRate = 12;
    
    if (companyId) {
      const { PayrollSettings } = require('../../models');
      const settings = await PayrollSettings.findOne({ where: { CompanyId: companyId } });
      if (settings) {
        pfCap = Number(settings.pfCap) || 1800;
        esiThreshold = Number(settings.esiThreshold) || 21000;
        ptAmount = Number(settings.ptMonthlyAmount) || 200;
        if (settings.pfEmployerRate !== undefined) pfEmployerRate = Number(settings.pfEmployerRate);
        if (settings.pfEmployeeRate !== undefined) pfEmployeeRate = Number(settings.pfEmployeeRate);
      }
    }

    const monthlyCtc = Number((annualCtc / 12).toFixed(2));
    const proratedMonthlyCtc = Number((monthlyCtc * prorationFactor).toFixed(2));
    const breakdown = {};
    
    // Sort components:
    // 1. Fixed or Percentage of CTC (except SPECIAL_ALLOWANCE)
    // 2. Percentage of other components (like HRA/DA of Basic)
    // 3. Formula / Balancing (like SPECIAL_ALLOWANCE)
    // 4. Deductions (PF, ESI, PT)
    
    const earnings = [];
    const deductions = [];
    
    structureComponents.forEach(sc => {
      const comp = sc.component || sc.SalaryComponent;
      if (!comp) return;

      const calculationType = sc.overrideCalculationType || comp.calculationType;
      const overrideVal = sc.overrideCalculationValue;
      const calculationValue = Number(overrideVal !== null && overrideVal !== undefined ? overrideVal : comp.calculationValue);
      const calculationBase = comp.calculationBase;

      const componentData = {
        id: comp.id,
        name: comp.name,
        code: comp.code,
        type: comp.type,
        calculationType,
        calculationBase,
        calculationValue,
        isStatutory: comp.isStatutory,
        isTaxable: comp.isTaxable,
        displayOrder: comp.displayOrder,
        monthlyAmount: 0
      };

      if (comp.type === 'Earning') {
        earnings.push(componentData);
      } else {
        deductions.push(componentData);
      }
    });

    // Sort earnings by display order and base dependencies
    earnings.sort((a, b) => {
      // Put BASIC first
      if (a.code === 'BASIC') return -1;
      if (b.code === 'BASIC') return 1;
      // Put SPECIAL_ALLOWANCE last
      if (a.code === 'SPECIAL_ALLOWANCE' || a.calculationBase === 'RemainingGross') return 1;
      if (b.code === 'SPECIAL_ALLOWANCE' || b.calculationBase === 'RemainingGross') return -1;
      return a.displayOrder - b.displayOrder;
    });

    let currentGrossEarnings = 0;
    
    // Step 1: Calculate Earnings that are CTC-based or Fixed
    earnings.forEach(e => {
      if (e.code === 'BASIC' && basicOverride) {
        // Use basic override if provided (convert annual override to monthly)
        e.monthlyAmount = Number(((basicOverride / 12) * prorationFactor).toFixed(2));
        breakdown[e.code] = e.monthlyAmount;
        currentGrossEarnings += e.monthlyAmount;
      } else if (e.calculationType === 'Fixed') {
        e.monthlyAmount = Number((e.calculationValue * prorationFactor).toFixed(2));
        breakdown[e.code] = e.monthlyAmount;
        currentGrossEarnings += e.monthlyAmount;
      } else if (e.calculationType === 'Percentage' && e.calculationBase === 'CTC') {
        e.monthlyAmount = Number(((proratedMonthlyCtc * e.calculationValue) / 100).toFixed(2));
        breakdown[e.code] = e.monthlyAmount;
        currentGrossEarnings += e.monthlyAmount;
      }
    });

    // Step 2: Calculate Earnings that depend on other earnings (e.g. HRA of BASIC)
    earnings.forEach(e => {
      if (e.calculationType === 'Percentage' && e.calculationBase && e.calculationBase !== 'CTC' && e.calculationBase !== 'RemainingGross') {
        // Normalize base key to UPPER so 'Basic' and 'BASIC' both resolve correctly
        const baseKey = e.calculationBase.toUpperCase();
        const baseVal = breakdown[baseKey] || 0;
        e.monthlyAmount = Number(((baseVal * e.calculationValue) / 100).toFixed(2));
        breakdown[e.code] = e.monthlyAmount;
        currentGrossEarnings += e.monthlyAmount;
      }
    });

    // Step 3: Calculate SPECIAL_ALLOWANCE balancing figure
    // In standard Indian Payroll (like Zoho), Employer PF is part of the CTC.
    // Therefore, Target Gross = Monthly CTC - Employer PF
    let employerPf = 0;
    const basicAmount = breakdown['BASIC'] || 0;
    if (basicAmount > 0 && pfEmployerRate > 0) {
      const computedPf = (basicAmount * pfEmployerRate) / 100;
      const actualCap = pfCap * prorationFactor;
      employerPf = computedPf > actualCap ? Number(actualCap.toFixed(2)) : Number(computedPf.toFixed(2));
    }
    
    // Add Employer PF to breakdown for records, but it does NOT go into Gross Earnings
    breakdown['PF_EMPLOYER'] = employerPf;

    const targetGross = proratedMonthlyCtc - employerPf;
    let balancingComponentFound = false;
    earnings.forEach(e => {
      if (e.code === 'SPECIAL_ALLOWANCE' || e.code === 'FIXED' || e.calculationBase === 'RemainingGross') {
        balancingComponentFound = true;
        const remaining = targetGross - currentGrossEarnings;
        e.monthlyAmount = remaining > 0 ? Number(remaining.toFixed(2)) : 0;
        breakdown[e.code] = e.monthlyAmount;
        currentGrossEarnings += e.monthlyAmount;
      }
    });

    // Auto-inject Special Allowance if there is leftover CTC and no balancing component was included
    if (!balancingComponentFound) {
      const remaining = targetGross - currentGrossEarnings;
      if (remaining > 0) {
        const specialAmount = Number(remaining.toFixed(2));
        earnings.push({
          id: 'auto-special-allowance',
          name: 'Special Allowance',
          code: 'SPECIAL_ALLOWANCE',
          type: 'Earning',
          calculationType: 'Balancing',
          monthlyAmount: specialAmount,
          isTaxable: true
        });
        breakdown['SPECIAL_ALLOWANCE'] = specialAmount;
        currentGrossEarnings += specialAmount;
      }
    }

    // Final total Gross
    const grossEarnings = Number(currentGrossEarnings.toFixed(2));

    // Step 4: Calculate Deductions (PF, ESI, PT)
    let totalDeductionsAmount = 0;
    
    // Auto-inject mandatory PF if not present
    const hasPf = deductions.some(d => d.code === 'PF' || d.code === 'PF_EMP');
    if (!hasPf) {
      deductions.push({
        id: 'mandatory-pf',
        name: 'Provident Fund (EPF)',
        code: 'PF_EMP',
        type: 'Deduction',
        calculationType: 'Percentage',
        calculationBase: 'BASIC',
        calculationValue: pfEmployeeRate,
        isStatutory: true,
        displayOrder: 1,
        monthlyAmount: 0
      });
    }

    deductions.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    const baseGross = prorationFactor > 0 ? grossEarnings / prorationFactor : 0;

    deductions.forEach(d => {
      if (d.code === 'PF_EMP' || d.code === 'PF') {
        // Employee PF: 12% of Basic, capped dynamically (default 1800)
        const basic = breakdown['BASIC'] || 0;
        const computedPf = (basic * d.calculationValue) / 100;
        const actualCap = pfCap * prorationFactor; // Cap is also prorated
        d.monthlyAmount = computedPf > actualCap ? Number(actualCap.toFixed(2)) : Number(computedPf.toFixed(2));
      } else if (d.code === 'ESI_EMP') {
        // Employee ESI: 0.75% of Gross, only if BASE Gross <= threshold (default 21000)
        if (baseGross <= esiThreshold && grossEarnings > 0) {
          d.monthlyAmount = Number(((grossEarnings * d.calculationValue) / 100).toFixed(2));
        } else {
          d.monthlyAmount = 0;
        }
      } else if (d.code === 'PT') {
        // Professional Tax: standard PT, or apply standard Indian slabs if BASE Gross > 15000: ptAmount, Gross between 10k and 15k: 150, etc.
        // Usually full amount is deducted if there's any earnings, but we won't deduct if gross is 0
        if (grossEarnings === 0) {
          d.monthlyAmount = 0;
        } else if (baseGross >= 15000) {
          d.monthlyAmount = ptAmount;
        } else if (baseGross >= 10000) {
          d.monthlyAmount = 150; // We can leave the lower slab as 150 or also make it configurable, keeping simple for now
        } else {
          d.monthlyAmount = 0;
        }
      } else if (d.calculationType === 'Fixed') {
        d.monthlyAmount = Number((d.calculationValue * prorationFactor).toFixed(2));
      } else if (d.calculationType === 'Percentage' && d.calculationBase === 'BASIC') {
        const basic = breakdown['BASIC'] || 0;
        d.monthlyAmount = Number(((basic * d.calculationValue) / 100).toFixed(2));
      } else if (d.calculationType === 'Percentage' && d.calculationBase === 'GROSS') {
        d.monthlyAmount = Number(((grossEarnings * d.calculationValue) / 100).toFixed(2));
      }

      breakdown[d.code] = d.monthlyAmount || 0;
      totalDeductionsAmount += (d.monthlyAmount || 0);
    });

    const totalDeductions = Number(totalDeductionsAmount.toFixed(2));
    const netPay = Number((grossEarnings - totalDeductions).toFixed(2));

    return {
      annualCtc,
      monthlyCtc,
      grossEarnings,
      totalDeductions,
      netPay,
      components: [...earnings, ...deductions],
      breakdown
    };
  }

  /**
   * Fetches active assignment and calculates current salary for an employee
   */
  static async getEmployeeSalaryDetails(employeeId, companyId) {
    const assignment = await EmployeeSalaryAssignment.findOne({
      where: { EmployeeId: employeeId, CompanyId: companyId, isActive: true },
      include: [
        {
          model: SalaryStructure,
          as: 'structure',
          include: [
            {
              model: SalaryStructureComponent,
              as: 'components',
              include: [
                {
                  model: SalaryComponent,
                  as: 'component'
                }
              ]
            }
          ]
        }
      ]
    });

    if (!assignment) return null;

    const structureComponents = assignment.structure?.components || [];
    const result = await this.calculateSalaryBreakdown(
      Number(assignment.ctcAmount),
      structureComponents,
      assignment.basicAmount ? Number(assignment.basicAmount) : null,
      companyId
    );

    return {
      assignmentId: assignment.id,
      ctcAmount: assignment.ctcAmount,
      basicAmountOverride: assignment.basicAmount,
      effectiveFrom: assignment.effectiveFrom,
      structureName: assignment.structure?.name,
      structureCode: assignment.structure?.code,
      ...result
    };
  }
}

module.exports = SalaryService;
