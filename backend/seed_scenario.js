const { 
  sequelize, 
  Company, 
  Employee, 
  SalaryComponent, 
  SalaryStructure, 
  SalaryStructureComponent, 
  EmployeeSalaryAssignment,
  Attendance,
  PayrollSettings,
  User
} = require('./models');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log("Connected to DB.");

    // Ensure we have a user
    let user = await User.findOne();
    if (!user) {
      user = await User.create({ name: 'Admin User', email: 'admin@tally.com', passwordHash: 'hash', role: 'SUPER_ADMIN' });
    }

    let companies = await Company.findAll();
    if (companies.length === 0) {
      companies = [await Company.create({ name: 'Tally TNC', CompanyCode: 'TALLY01' })];
    }

    for (const company of companies) {
      // Set PayrollSettings
      await PayrollSettings.upsert({
        CompanyId: company.id,
        pfEmployeeRate: 12,
        esiThreshold: 21000,
        ptMonthlyAmount: 200,
        pfCap: 1800
      });

      // Create or find Components
      const [compBasic] = await SalaryComponent.findOrCreate({ where: { CompanyId: company.id, code: 'BASIC' }, defaults: { name: 'Basic', type: 'Earning', calculationType: 'Fixed', calculationValue: 0, isStatutory: false, displayOrder: 1 }});
      const [compHra] = await SalaryComponent.findOrCreate({ where: { CompanyId: company.id, code: 'HRA' }, defaults: { name: 'HRA', type: 'Earning', calculationType: 'Percentage', calculationBase: 'BASIC', calculationValue: 50, isStatutory: false, displayOrder: 2 }});
      const [compSpecial] = await SalaryComponent.findOrCreate({ where: { CompanyId: company.id, code: 'SPECIAL_ALLOWANCE' }, defaults: { name: 'Special Allowance', type: 'Earning', calculationType: 'Fixed', calculationBase: 'RemainingGross', calculationValue: 0, isStatutory: false, displayOrder: 3 }});
      const [compPf] = await SalaryComponent.findOrCreate({ where: { CompanyId: company.id, code: 'PF' }, defaults: { name: 'Provident Fund', type: 'Deduction', calculationType: 'Percentage', calculationBase: 'BASIC', calculationValue: 12, isStatutory: true, displayOrder: 1 }});
      const [compEsi] = await SalaryComponent.findOrCreate({ where: { CompanyId: company.id, code: 'ESI_EMP' }, defaults: { name: 'ESI', type: 'Deduction', calculationType: 'Percentage', calculationBase: 'GROSS', calculationValue: 0.75, isStatutory: true, displayOrder: 2 }});
      const [compPt] = await SalaryComponent.findOrCreate({ where: { CompanyId: company.id, code: 'PT' }, defaults: { name: 'Professional Tax', type: 'Deduction', calculationType: 'Fixed', calculationValue: 200, isStatutory: true, displayOrder: 3 }});
      const [compTds] = await SalaryComponent.findOrCreate({ where: { CompanyId: company.id, code: 'TDS' }, defaults: { name: 'Income Tax (TDS)', type: 'Deduction', calculationType: 'Fixed', calculationValue: 1250, isStatutory: true, displayOrder: 4 }});

      // Create Structure
      const [structure] = await SalaryStructure.findOrCreate({ where: { CompanyId: company.id, code: 'IT_STD' }, defaults: { name: 'Standard IT Structure', isActive: true, effectiveFrom: new Date() }});

      // We can just ignore bulkCreate errors if they exist
      try {
        await SalaryStructureComponent.bulkCreate([
          { SalaryStructureId: structure.id, SalaryComponentId: compBasic.id },
          { SalaryStructureId: structure.id, SalaryComponentId: compHra.id },
          { SalaryStructureId: structure.id, SalaryComponentId: compSpecial.id },
          { SalaryStructureId: structure.id, SalaryComponentId: compPf.id },
          { SalaryStructureId: structure.id, SalaryComponentId: compEsi.id },
          { SalaryStructureId: structure.id, SalaryComponentId: compPt.id },
          { SalaryStructureId: structure.id, SalaryComponentId: compTds.id }
        ]);
      } catch(e) {}

      // Create Employee
      const [emp] = await Employee.findOrCreate({
        where: { CompanyId: company.id, employeeId: 'EMP-001' },
        defaults: {
          name: 'Raj Kumar',
          firstName: 'Raj',
          lastName: 'Kumar',
          workEmail: 'raj@tally.com',
          department: 'Engineering',
          designation: 'Senior Developer',
          status: 'Active',
          dateOfJoining: '2025-01-01'
        }
      });

      // Assign Structure to Employee
      await EmployeeSalaryAssignment.findOrCreate({
        where: { CompanyId: company.id, EmployeeId: emp.id },
        defaults: {
          SalaryStructureId: structure.id,
          ctcAmount: 600000,
          basicAmount: 300000,
          isActive: true,
          effectiveFrom: new Date()
        }
      });

      // Log 5 days absence in current month (June 2026)
      for(let i=1; i<=5; i++) {
        await Attendance.findOrCreate({
          where: {
            CompanyId: company.id,
            EmployeeId: emp.id,
            AttendanceDate: new Date(`2026-06-0${i}`)
          },
          defaults: {
            Status: 'Absent'
          }
        });
      }
      console.log("Seeded for company: " + company.name);
    }

    console.log("All Seeding complete!");
    process.exit(0);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
