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
   */
  static calculateSalaryBreakdown(annualCtc, structureComponents, basicOverride = null) {
    const monthlyCtc = Number((annualCtc / 12).toFixed(2));
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
      const calculationValue = Number(sc.overrideCalculationValue !== null ? sc.overrideCalculationValue : comp.calculationValue);
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
        e.monthlyAmount = Number((basicOverride / 12).toFixed(2));
        breakdown[e.code] = e.monthlyAmount;
        currentGrossEarnings += e.monthlyAmount;
      } else if (e.calculationType === 'Fixed') {
        e.monthlyAmount = e.calculationValue;
        breakdown[e.code] = e.monthlyAmount;
        currentGrossEarnings += e.monthlyAmount;
      } else if (e.calculationType === 'Percentage' && e.calculationBase === 'CTC') {
        e.monthlyAmount = Number(((monthlyCtc * e.calculationValue) / 100).toFixed(2));
        breakdown[e.code] = e.monthlyAmount;
        currentGrossEarnings += e.monthlyAmount;
      }
    });

    // Step 2: Calculate Earnings that depend on other earnings (e.g. HRA of BASIC)
    earnings.forEach(e => {
      if (e.calculationType === 'Percentage' && e.calculationBase && e.calculationBase !== 'CTC' && e.calculationBase !== 'RemainingGross') {
        const baseKey = e.calculationBase.toUpperCase();
        const baseVal = breakdown[baseKey] || breakdown[e.calculationBase] || 0;
        e.monthlyAmount = Number(((baseVal * e.calculationValue) / 100).toFixed(2));
        breakdown[e.code] = e.monthlyAmount;
        currentGrossEarnings += e.monthlyAmount;
      }
    });

    // Step 3: Calculate SPECIAL_ALLOWANCE balancing figure (Gross target = Monthly CTC)
    // Gross target can be Monthly CTC if there are no employer contribution components.
    // If there is an employer PF component, it should subtract it, but by default:
    const targetGross = monthlyCtc;
    earnings.forEach(e => {
      if (e.code === 'SPECIAL_ALLOWANCE' || e.code === 'FIXED' || e.calculationBase === 'RemainingGross') {
        const remaining = targetGross - currentGrossEarnings;
        e.monthlyAmount = remaining > 0 ? Number(remaining.toFixed(2)) : 0;
        breakdown[e.code] = e.monthlyAmount;
        currentGrossEarnings += e.monthlyAmount;
      }
    });

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
        calculationValue: 12,
        isStatutory: true,
        displayOrder: 1,
        monthlyAmount: 0
      });
    }

    deductions.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    deductions.forEach(d => {
      if (d.code === 'PF_EMP' || d.code === 'PF') {
        // Employee PF: 12% of Basic, capped at 1800
        const basic = breakdown['BASIC'] || 0;
        const computedPf = (basic * d.calculationValue) / 100;
        d.monthlyAmount = computedPf > 1800 ? 1800 : Number(computedPf.toFixed(2));
      } else if (d.code === 'ESI_EMP') {
        // Employee ESI: 0.75% of Gross, only if Gross <= 21000
        if (grossEarnings <= 21000) {
          d.monthlyAmount = Number(((grossEarnings * d.calculationValue) / 100).toFixed(2));
        } else {
          d.monthlyAmount = 0;
        }
      } else if (d.code === 'PT') {
        // Professional Tax: standard PT of 200, or apply standard Indian slabs if Gross > 15000: 200, Gross between 10k and 15k: 150, etc.
        // Let's use the configured calculationValue if Fixed. If value is 200, apply gross salary check:
        if (grossEarnings >= 15000) {
          d.monthlyAmount = d.calculationValue; // e.g. 200
        } else if (grossEarnings >= 10000) {
          d.monthlyAmount = 150;
        } else {
          d.monthlyAmount = 0;
        }
      } else if (d.calculationType === 'Fixed') {
        d.monthlyAmount = d.calculationValue;
      } else if (d.calculationType === 'Percentage' && d.calculationBase === 'BASIC') {
        const basic = breakdown['BASIC'] || 0;
        d.monthlyAmount = Number(((basic * d.calculationValue) / 100).toFixed(2));
      } else if (d.calculationType === 'Percentage' && d.calculationBase === 'GROSS') {
        d.monthlyAmount = Number(((grossEarnings * d.calculationValue) / 100).toFixed(2));
      }

      breakdown[d.code] = d.monthlyAmount;
      totalDeductionsAmount += d.monthlyAmount;
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
    const result = this.calculateSalaryBreakdown(
      Number(assignment.ctcAmount),
      structureComponents,
      assignment.basicAmount ? Number(assignment.basicAmount) : null
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
