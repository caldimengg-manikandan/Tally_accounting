const { SalaryComponent, Company } = require('./models');

async function seedAllCompanies() {
  const companies = await Company.findAll();
  if (!companies.length) {
    console.log('No companies found.');
    return;
  }

  console.log(`Found ${companies.length} companies. Replacing salary components for all of them...`);

  const componentsData = [
    { name: 'Basic', code: 'BASIC', type: 'Earning', calculationType: 'Percentage', calculationBase: 'CTC', calculationValue: 50, isActive: true, displayOrder: 1 },
    { name: 'House Rent Allowance', code: 'HRA', type: 'Earning', calculationType: 'Percentage', calculationBase: 'Basic', calculationValue: 50, isActive: true, displayOrder: 2 },
    { name: 'Conveyance Allowance', code: 'CONVEYANCE', type: 'Earning', calculationType: 'Fixed', calculationValue: 0, isActive: true, displayOrder: 3 },
    { name: 'Children Education Allowance', code: 'CHILD_EDU', type: 'Earning', calculationType: 'Fixed', calculationValue: 0, isActive: false, displayOrder: 4 },
    { name: 'Transport Allowance', code: 'TRANSPORT', type: 'Earning', calculationType: 'Fixed', calculationValue: 1600, isActive: false, displayOrder: 5 },
    { name: 'Travelling Allowance', code: 'TRAVELLING', type: 'Earning', calculationType: 'Fixed', calculationValue: 0, isActive: false, displayOrder: 6 },
    { name: 'Fixed Allowance', code: 'FIXED', type: 'Earning', calculationType: 'Fixed', calculationValue: 0, isActive: true, displayOrder: 7 },
    { name: 'Overtime Allowance', code: 'OVERTIME', type: 'Earning', calculationType: 'Formula', calculationValue: 0, isActive: false, displayOrder: 8 },
    { name: 'Gratuity', code: 'GRATUITY', type: 'Statutory', calculationType: 'Formula', calculationValue: 0, isActive: true, displayOrder: 9 },
    { name: 'Bonus', code: 'BONUS', type: 'Earning', calculationType: 'Formula', calculationValue: 0, isActive: true, displayOrder: 10 },
    { name: 'Commission', code: 'COMMISSION', type: 'Earning', calculationType: 'Formula', calculationValue: 0, isActive: true, displayOrder: 11 },
    { name: 'Leave Encashment', code: 'LEAVE_ENCASH', type: 'Earning', calculationType: 'Formula', calculationValue: 0, isActive: true, displayOrder: 12 },
    { name: 'Notice Pay', code: 'NOTICE_PAY', type: 'Earning', calculationType: 'Formula', calculationValue: 0, isActive: true, displayOrder: 13 },
    { name: 'Hold Salary', code: 'HOLD_SALARY', type: 'Earning', calculationType: 'Formula', calculationValue: 0, isActive: true, displayOrder: 14 }
  ];

  for (const company of companies) {
    // Delete existing components for this company
    await SalaryComponent.destroy({ where: { CompanyId: company.id } });

    // Insert new components
    for (const comp of componentsData) {
      await SalaryComponent.create({ ...comp, CompanyId: company.id });
    }
    console.log(`Seeded 14 components for company: ${company.name}`);
  }

  console.log('All companies seeded successfully.');
  process.exit(0);
}

seedAllCompanies();
