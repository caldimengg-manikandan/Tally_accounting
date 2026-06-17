const { Employee, Company, SalaryStructure } = require('../models');

async function seedTestEmployees() {
  console.log('--- SEEDING TEST EMPLOYEES ---');
  try {
    const company = await Company.findOne();
    if (!company) {
      console.error('No company found in the database. Please seed the database first.');
      process.exit(1);
    }
    console.log(`Using company: ${company.name} (${company.id})`);

    const employeesData = [
      {
        employeeId: 'EMP-001',
        name: 'Rajesh Kumar',
        firstName: 'Rajesh',
        middleName: '',
        lastName: 'Kumar',
        gender: 'Male',
        dob: '1990-08-15',
        bloodGroup: 'O+',
        fatherName: 'Ramesh Kumar',
        motherName: 'Sita Devi',
        maritalStatus: 'Married',
        email: 'rajesh.kumar@ibm.com',
        personalEmail: 'rajesh.k@gmail.com',
        phone: '9876543210',
        emergencyContactName: 'Ramesh Kumar',
        emergencyContactRelation: 'Father',
        emergencyContactPhone: '9876543211',
        presentAddressLine1: 'Flat 101, Blue Sky Apartments',
        presentAddressLine2: 'Indiranagar',
        presentAddressCity: 'Bengaluru',
        presentAddressState: 'Karnataka',
        presentAddressCountry: 'India',
        presentAddressZip: '560038',
        sameAsPresentAddress: true,
        dateOfJoining: '2020-06-01',
        employmentType: 'Full Time',
        department: 'Engineering',
        designation: 'Senior Software Engineer',
        workLocation: 'Bengaluru Office',
        status: 'Active',
        bankName: 'HDFC Bank',
        bankAccountNumber: '50100234567890',
        bankAccountType: 'Savings',
        bankBranchName: 'Indiranagar Branch',
        ifscCode: 'HDFC0001234',
        panNumber: 'ABCDE1234F',
        aadhaarNumber: '123456789012',
        pfNumber: 'KN/BLR/0012345/000/0000123',
        esiNumber: '31001234560001001',
        pranNumber: '110012345678',
        highestQualification: 'Bachelor of Technology',
        universityCollege: 'IIT Kharagpur',
        yearOfPassing: 2012,
        previousCompany: 'Wipro Technologies',
        previousExperience: 8,
        isDraft: false,
        CompanyId: company.id
      },
      {
        employeeId: 'EMP-002',
        name: 'Priya Sharma',
        firstName: 'Priya',
        middleName: '',
        lastName: 'Sharma',
        gender: 'Female',
        dob: '1993-11-22',
        bloodGroup: 'B+',
        fatherName: 'Alok Sharma',
        motherName: 'Geeta Sharma',
        maritalStatus: 'Single',
        email: 'priya.sharma@ibm.com',
        personalEmail: 'priya.s@gmail.com',
        phone: '9876543220',
        emergencyContactName: 'Alok Sharma',
        emergencyContactRelation: 'Father',
        emergencyContactPhone: '9876543221',
        presentAddressLine1: 'House No 45, Green Glen Layout',
        presentAddressLine2: 'Bellandur',
        presentAddressCity: 'Bengaluru',
        presentAddressState: 'Karnataka',
        presentAddressCountry: 'India',
        presentAddressZip: '560103',
        sameAsPresentAddress: true,
        dateOfJoining: '2021-08-16',
        employmentType: 'Full Time',
        department: 'Human Resources',
        designation: 'HR Manager',
        workLocation: 'Bengaluru Office',
        status: 'Active',
        bankName: 'ICICI Bank',
        bankAccountNumber: '000401234567',
        bankAccountType: 'Savings',
        bankBranchName: 'Bellandur Branch',
        ifscCode: 'ICIC0000004',
        panNumber: 'FGHIJ5678K',
        aadhaarNumber: '234567890123',
        pfNumber: 'KN/BLR/0012345/000/0000124',
        esiNumber: '31001234560001002',
        pranNumber: '110012345679',
        highestQualification: 'MBA in HR',
        universityCollege: 'Symbiosis Pune',
        yearOfPassing: 2015,
        previousCompany: 'Infosys Ltd',
        previousExperience: 6,
        isDraft: false,
        CompanyId: company.id
      },
      {
        employeeId: 'EMP-003',
        name: 'Amit Patel',
        firstName: 'Amit',
        middleName: '',
        lastName: 'Patel',
        gender: 'Male',
        dob: '1988-04-05',
        bloodGroup: 'A+',
        fatherName: 'Dinesh Patel',
        motherName: 'Rekha Patel',
        maritalStatus: 'Married',
        email: 'amit.patel@ibm.com',
        personalEmail: 'amit.p@gmail.com',
        phone: '9876543230',
        emergencyContactName: 'Rekha Patel',
        emergencyContactRelation: 'Wife',
        emergencyContactPhone: '9876543231',
        presentAddressLine1: 'Flat 502, Orchid Towers',
        presentAddressLine2: 'Whitefield',
        presentAddressCity: 'Bengaluru',
        presentAddressState: 'Karnataka',
        presentAddressCountry: 'India',
        presentAddressZip: '560066',
        sameAsPresentAddress: true,
        dateOfJoining: '2019-03-01',
        employmentType: 'Full Time',
        department: 'Sales',
        designation: 'Sales Director',
        workLocation: 'Bengaluru Office',
        status: 'Active',
        bankName: 'SBI',
        bankAccountNumber: '30012345678',
        bankAccountType: 'Savings',
        bankBranchName: 'Whitefield Branch',
        ifscCode: 'SBIN0001234',
        panNumber: 'LMNOP9012Q',
        aadhaarNumber: '345678901234',
        pfNumber: 'KN/BLR/0012345/000/0000125',
        esiNumber: '31001234560001003',
        pranNumber: '110012345680',
        highestQualification: 'Master of Commerce',
        universityCollege: 'Mumbai University',
        yearOfPassing: 2010,
        previousCompany: 'Oracle India',
        previousExperience: 9,
        isDraft: false,
        CompanyId: company.id
      }
    ];

    for (const data of employeesData) {
      // Check if employee exists by employeeId
      let emp = await Employee.findOne({ where: { employeeId: data.employeeId }, paranoid: false });
      if (!emp) {
        emp = await Employee.create(data);
        console.log(`✅ Created employee: ${data.name} (${data.employeeId})`);
      } else {
        await emp.update(data);
        console.log(`🔄 Updated existing employee: ${data.name} (${data.employeeId})`);
      }

      // Add default salary structures
      let struct = await SalaryStructure.findOne({ where: { EmployeeId: emp.id } });
      const annualCTC = data.employeeId === 'EMP-001' ? 1200000 : data.employeeId === 'EMP-002' ? 900000 : 1800000;
      const monthlyGross = Math.round(annualCTC / 12);
      const basic = Math.round(monthlyGross * 0.50);
      const hra = Math.round(basic * 0.50);
      const pf = Math.min(Math.round(basic * 0.12), 1800);
      const pt = 200;
      const incentives = monthlyGross - basic - hra;

      const structPayload = {
        annualCTC,
        basic,
        hra,
        da: 0,
        incentives,
        pfDeduction: pf,
        esiDeduction: 0,
        profTaxDeduction: pt,
        EmployeeId: emp.id,
        CompanyId: company.id
      };

      if (!struct) {
        await SalaryStructure.create(structPayload);
        console.log(`   └─ Created salary structure for ${data.name}`);
      } else {
        await struct.update(structPayload);
        console.log(`   └─ Updated salary structure for ${data.name}`);
      }
    }

    console.log('--- SEED COMPLETE ---');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding test employees:', err);
    process.exit(1);
  }
}

seedTestEmployees();
