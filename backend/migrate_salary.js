require('dotenv').config();
const { 
  sequelize, 
  Company, 
  SalaryComponent, 
  SalaryStructure, 
  SalaryStructureComponent, 
  EmployeeSalaryAssignment 
} = require('./models');

async function runMigration() {
  console.log('--- STARTING SALARY STRUCTURES SCHEMA MIGRATION ---');
  
  try {
    // Drop existing tables and indexes in reverse order of foreign key dependencies
    console.log('Dropping old payroll-related tables and indexes if they exist...');
    await sequelize.query('DROP TABLE IF EXISTS "EmployeeSalaryAssignments" CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS "SalaryStructureComponents" CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS "SalaryStructures" CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS "SalaryComponents" CASCADE;');
    await sequelize.query('DROP INDEX IF EXISTS "salary_components__company_id_code" CASCADE;');
    await sequelize.query('DROP INDEX IF EXISTS "salary_structures__company_id_code" CASCADE;');
    await sequelize.query('DROP INDEX IF EXISTS "salary_structure_components__salary_structure_id_salary_c" CASCADE;');
    
    // Sync the new/updated models
    console.log('Syncing new tables to database...');
    await SalaryComponent.sync({ force: true });
    await SalaryStructure.sync({ force: true });
    await SalaryStructureComponent.sync({ force: true });
    await EmployeeSalaryAssignment.sync({ force: true });
    
    console.log('Tables synced successfully.');
    
    // Fetch all existing companies to seed default components for each
    const companies = await Company.findAll();
    console.log(`Found ${companies.length} company/companies. Seeding default salary components...`);
    
    const defaultComponents = [
      {
        name: 'Basic Salary',
        code: 'BASIC',
        type: 'Earning',
        calculationType: 'Percentage',
        calculationBase: 'CTC',
        calculationValue: 50.00,
        isStatutory: false,
        isTaxable: true,
        displayOrder: 1,
        description: 'Standard Basic Salary, typically 50% of CTC'
      },
      {
        name: 'House Rent Allowance',
        code: 'HRA',
        type: 'Earning',
        calculationType: 'Percentage',
        calculationBase: 'BASIC',
        calculationValue: 40.00,
        isStatutory: false,
        isTaxable: true,
        displayOrder: 2,
        description: 'House Rent Allowance, typically 40% of Basic (50% for metro cities)'
      },
      {
        name: 'Dearness Allowance',
        code: 'DA',
        type: 'Earning',
        calculationType: 'Percentage',
        calculationBase: 'BASIC',
        calculationValue: 10.00,
        isStatutory: false,
        isTaxable: true,
        displayOrder: 3,
        description: 'Dearness Allowance to mitigate cost of living'
      },
      {
        name: 'Conveyance Allowance',
        code: 'CONVEYANCE',
        type: 'Earning',
        calculationType: 'Fixed',
        calculationBase: null,
        calculationValue: 1600.00,
        isStatutory: false,
        isTaxable: false,
        displayOrder: 4,
        description: 'Fixed transport/conveyance allowance'
      },
      {
        name: 'Medical Allowance',
        code: 'MEDICAL',
        type: 'Earning',
        calculationType: 'Fixed',
        calculationBase: null,
        calculationValue: 1250.00,
        isStatutory: false,
        isTaxable: true,
        displayOrder: 5,
        description: 'Fixed medical allowance'
      },
      {
        name: 'Special Allowance',
        code: 'SPECIAL_ALLOWANCE',
        type: 'Earning',
        calculationType: 'Formula',
        calculationBase: 'RemainingGross',
        calculationValue: 100.00,
        isStatutory: false,
        isTaxable: true,
        displayOrder: 6,
        description: 'Balancing allowance to bridge CTC gap'
      },
      {
        name: 'Provident Fund (Employee)',
        code: 'PF_EMP',
        type: 'Deduction',
        calculationType: 'Percentage',
        calculationBase: 'BASIC',
        calculationValue: 12.00,
        isStatutory: true,
        isTaxable: false,
        displayOrder: 7,
        description: 'Employee Provident Fund contribution (12% of Basic, capped at 1800)'
      },
      {
        name: 'Employee State Insurance (Employee)',
        code: 'ESI_EMP',
        type: 'Deduction',
        calculationType: 'Percentage',
        calculationBase: 'GROSS',
        calculationValue: 0.75,
        isStatutory: true,
        isTaxable: false,
        displayOrder: 8,
        description: 'Employee State Insurance contribution (0.75% of Gross, applicable if Gross <= 21000)'
      },
      {
        name: 'Professional Tax',
        code: 'PT',
        type: 'Deduction',
        calculationType: 'Fixed',
        calculationBase: null,
        calculationValue: 200.00,
        isStatutory: true,
        isTaxable: false,
        displayOrder: 9,
        description: 'State statutory Professional Tax (default 200 per month)'
      }
    ];
    
    for (const company of companies) {
      console.log(`Seeding components for company: ${company.name} (${company.id})`);
      for (const component of defaultComponents) {
        await SalaryComponent.create({
          ...component,
          CompanyId: company.id
        });
      }
    }
    
    console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
