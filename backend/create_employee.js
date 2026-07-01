const { User, Company } = require('./models');
const bcrypt = require('bcryptjs');

async function createEmployee() {
  try {
    const email = 'employee@test.com';
    const password = 'password123';
    
    // Find the first company
    const company = await Company.findOne();
    if (!company) {
      console.log('No company found in the database. Please create a company first.');
      process.exit(1);
    }

    // Check if user already exists
    let user = await User.findOne({ where: { email } });
    
    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await User.create({
        name: 'Test Employee',
        email,
        password: hashedPassword,
        role: 'EMPLOYEE',
        activeCompanyId: company.id
      });
      console.log('Created new employee user.');
    } else {
      user.role = 'EMPLOYEE';
      user.activeCompanyId = company.id;
      await user.save();
      console.log('Updated existing user to EMPLOYEE role.');
    }

    // Associate user with the company
    await user.addCompany(company);
    console.log(`\n✅ Successfully created/updated employee account!`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Assigned to Company: ${company.name}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating employee:', error);
    process.exit(1);
  }
}

createEmployee();
